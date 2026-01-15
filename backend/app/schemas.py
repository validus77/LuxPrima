from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List, Any

class SourceBase(BaseModel):
    url: str
    name: Optional[str] = None
    source_type: str = "primary"
    is_active: bool = True

class SourceCreate(SourceBase):
    pass

class SourceResponse(SourceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    title: str

class ReportResponse(ReportBase):
    id: int
    generated_at: datetime
    content_markdown: Optional[str] = None
    logs: Optional[List[str]] = []
    # content_json could be added if needed by frontend logic

    class Config:
        from_attributes = True

class LLMConfig(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    base_url: Optional[str] = None

class ScheduleBase(BaseModel):
    time: str
    is_active: bool = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
