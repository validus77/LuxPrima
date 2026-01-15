from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Schedule
from app.schemas import ScheduleCreate, ScheduleResponse
from app.services.scheduler import scheduler_service

router = APIRouter()

@router.get("/", response_model=List[ScheduleResponse])
def read_schedules(db: Session = Depends(get_db)):
    return db.query(Schedule).all()

@router.post("/", response_model=ScheduleResponse)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    # Validate time format HH:MM
    try:
        h, m = map(int, schedule.time.split(":"))
        if not (0 <= h < 24 and 0 <= m < 60):
            raise ValueError
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

    db_schedule = Schedule(time=schedule.time, is_active=schedule.is_active)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Add to scheduler
    if db_schedule.is_active:
        scheduler_service.add_job(db_schedule.id, db_schedule.time)
        
    return db_schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    # Remove from scheduler
    scheduler_service.remove_job(schedule_id)
    
    db.delete(schedule)
    db.commit()
    return {"ok": True}

@router.get("/next-run")
def get_next_run():
    # Simple check of next job
    jobs = scheduler_service.scheduler.get_jobs()
    if not jobs:
        return {"next_run": None}
    
    # Find next run time
    next_runs = [job.next_run_time for job in jobs if job.next_run_time]
    if not next_runs:
        return {"next_run": None}
        
    return {"next_run": min(next_runs).isoformat()}
