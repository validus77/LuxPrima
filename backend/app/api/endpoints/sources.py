from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Source
from app.schemas import SourceCreate, SourceResponse

router = APIRouter()

@router.get("/", response_model=List[SourceResponse])
def read_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sources = db.query(Source).offset(skip).limit(limit).all()
    return sources

@router.post("/", response_model=SourceResponse)
def create_source(source: SourceCreate, db: Session = Depends(get_db)):
    db_source = Source(url=source.url, name=source.name, source_type=source.source_type, is_active=source.is_active)
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return {"ok": True}
