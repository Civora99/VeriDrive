import os
from pathlib import Path
from dotenv import load_dotenv

backend_env = Path(__file__).resolve().parent / ".env"
root_env_local = Path(__file__).resolve().parent.parent / ".env.local"
root_env = Path(__file__).resolve().parent.parent / ".env"

if root_env_local.exists():
    load_dotenv(root_env_local, override=True)
if backend_env.exists():
    load_dotenv(backend_env, override=True)
if root_env.exists():
    load_dotenv(root_env, override=True)
load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "PACCAR TestPilot AI"
    VERSION: str = "1.0.0"
    
    # Gemini configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
    
    # Demo Mode: if True or if GEMINI_API_KEY is empty, deterministic mock responses are used
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    
    # CORS Origins
    _raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]
    
    # Server network settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Main standard demo requirement
    STANDARD_DEMO_REQUIREMENT: str = (
        "The telematics ECU shall transmit vehicle GPS position every 10 seconds "
        "when ignition is ON and cellular connectivity is available."
    )

settings = Settings()
