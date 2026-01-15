from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models import Setting
from pydantic import BaseModel

class SettingUpdate(BaseModel):
    key: str
    value: str

router = APIRouter()

@router.get("/", response_model=Dict[str, str])
def read_settings(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    return {s.key: s.value for s in settings}

@router.post("/", response_model=Dict[str, str])
def update_settings(settings_update: List[SettingUpdate], db: Session = Depends(get_db)):
    for s in settings_update:
        setting = db.query(Setting).filter(Setting.key == s.key).first()
        if not setting:
            setting = Setting(key=s.key, value=s.value)
            db.add(setting)
        else:
            setting.value = s.value
    db.commit()
    
    # Return all settings
    all_settings = db.query(Setting).all()
    return {s.key: s.value for s in all_settings}

@router.get("/local-models")
def get_local_models(base_url: str):
    import requests
    try:
        # Assume OpenAI compatible endpoint
        url = f"{base_url.rstrip('/')}/models"
        print(f"Attempting to fetch models from: {url}") # Debug log
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        # Extract model IDs. Data format usually { "data": [ { "id": "model-id", ... } ] }
        models = [m["id"] for m in data.get("data", [])]
        print(f"Successfully fetched models: {models}") # Debug log
        return {"models": models}
    except Exception as e:
        print(f"Error fetching models from {base_url}: {str(e)}") # Debug log
        # Fallback or error
        return {"error": str(e), "models": []}
