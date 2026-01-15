from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LuxPrima"
    DATABASE_URL: str = "sqlite:///./luxprima.db"
    
    # LLM Defaults (can be overridden by DB settings, but env vars are good for initial setup)
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    LOCAL_LLM_URL: str = "http://host.docker.internal:8080/v1" # Use host.docker.internal for Docker -> Host access
    APP_TIMEZONE: str = "Australia/Sydney"

    class Config:
        env_file = ".env"

settings = Settings()
