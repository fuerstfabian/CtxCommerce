"""
BACKUP: Multi-Client Architektur Konfiguration

Diese Datei enthält den Code, den wir für die 1:1 Evaluierung entfernt haben.
Wenn das Projekt später wieder für mehrere Frontends (z.B. lokales Next.js UND Shopify)
genutzt werden soll, kannst du diese Snippets wieder in die config.py und main.py einfügen.
"""

# =============================================================================
# 1. Für backend/config.py
# =============================================================================
# Ersetze die einfache 'allowed_origin' Variable durch diese Struktur mit dem Validator:

'''
from typing import List, Union, Any
from pydantic import field_validator

class AppSettings(BaseSettings):
    # Default is empty list. Using Union prevents pydantic_settings from throwing JSON errors on raw strings
    allowed_origins: Union[str, List[str]] = []
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
        
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = AppSettings()
# Extract the safely validated list
ALLOWED_ORIGINS: List[str] = settings.allowed_origins

if not ALLOWED_ORIGINS:
    logging.warning("No ALLOWED_ORIGINS defined in .env. The API will block all cross-origin requests.")
'''

# =============================================================================
# 2. Für backend/main.py
# =============================================================================
# Ändere die CORSMiddleware so ab, dass sie die Liste akzeptiert:

'''
from backend.config import REDIS_URL, ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''

# =============================================================================
# 3. Für die .env Datei
# =============================================================================
# Ändere ALLOWED_ORIGIN zu ALLOWED_ORIGINS und nutze eine kommagetrennte Liste:

'''
ALLOWED_ORIGINS=http://localhost:3000,https://dein-shop.myshopify.com
'''
