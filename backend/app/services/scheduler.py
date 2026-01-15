from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.intelligence import intelligence_service
from app.models import Schedule
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.tz = ZoneInfo(settings.APP_TIMEZONE)
        self.scheduler = AsyncIOScheduler(timezone=self.tz)

    def start(self):
        self.scheduler.start()

    def add_job(self, schedule_id: int, time_str: str):
        hour, minute = map(int, time_str.split(":"))
        trigger = CronTrigger(hour=hour, minute=minute, timezone=self.tz)
        
        job_id = str(schedule_id)
        
        # Remove if exists
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        self.scheduler.add_job(
            self.run_report_job,
            trigger=trigger,
            id=job_id,
            replace_existing=True
        )
        logger.info(f"Scheduled job {job_id} for {time_str}")

    def remove_job(self, schedule_id: int):
        job_id = str(schedule_id)
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed job {job_id}")

    def load_jobs_from_db(self):
        db = SessionLocal()
        try:
            schedules = db.query(Schedule).filter(Schedule.is_active == True).all()
            for schedule in schedules:
                self.add_job(schedule.id, schedule.time)
        finally:
            db.close()

    async def run_report_job(self):
        logger.info("Running scheduled report generation...")
        db = SessionLocal()
        try:
            await intelligence_service.generate_daily_report(db)
        except Exception as e:
            logger.error(f"Scheduled report failed: {e}")
        finally:
            db.close()

scheduler_service = SchedulerService()
