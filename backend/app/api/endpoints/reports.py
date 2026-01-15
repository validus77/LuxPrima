from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Report
from app.schemas import ReportResponse
from app.services.intelligence import intelligence_service
from app.services.pdf_service import pdf_service
from app.services.email_service import email_service
import re
from pydantic import BaseModel

class ShareRequest(BaseModel):
    email: str

router = APIRouter()

@router.get("/", response_model=List[ReportResponse])
def read_reports(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()
    return reports

@router.get("/status")
def get_service_status():
    return {"status": intelligence_service.current_status}

@router.get("/{report_id}/pdf")
async def get_report_pdf(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Simple Metadata Parsing from Logs (Backend version of frontend logic)
    source_count = 0
    model_used = "LuxPrima Hybrid"
    if report.logs:
        unique_sources = set()
        for log in report.logs:
            if "Initializing LLM Provider:" in log:
                model_used = log.split("Initializing LLM Provider:")[1].strip()
            url_match = re.search(r"Source: (https?://[^\s]+)", log)
            if url_match:
                unique_sources.add(url_match.group(1))
        source_count = len(unique_sources)

    pdf_bytes = await pdf_service.generate_pdf(
        title=report.title,
        markdown_content=report.content_markdown or "",
        metadata={
            "date": report.generated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "sources": str(source_count),
            "model": model_used
        }
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=luxprima_briefing_{report_id}.pdf"
        }
    )

@router.post("/{report_id}/share")
async def share_report(report_id: int, request: ShareRequest, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        await email_service.send_report_email(
            db, 
            request.email, 
            report.title, 
            report.content_markdown or ""
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{report_id}", response_model=ReportResponse)
async def read_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return {"error": "Report not found"}
    return report

@router.post("/generate")
async def generate_report_endpoint(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(intelligence_service.generate_daily_report, db)
    return {"message": "Report generation started in background"}

@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"ok": True}


