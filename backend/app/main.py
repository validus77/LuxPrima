
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.endpoints import sources, reports, settings, schedules
from app.services.scheduler import scheduler_service

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler_service.start()
    scheduler_service.load_jobs_from_db()
    yield
    # Shutdown (scheduler is async, shuts down with event loop usually)

app = FastAPI(title="LuxPrima API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])

@app.get("/")
@app.get("/api")
@app.get("/api/")
@app.get("/health")
def read_root():
    return {"status": "ok", "service": "LuxPrima", "service_id": "PLASMA_AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
