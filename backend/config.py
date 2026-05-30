"""
Central configuration module for CtxCommerce.
Loads, parses, and exports all environment variables as typed constants.

This is the ONLY module that reads from os.environ / dotenv.
All other backend modules import their configuration exclusively from here.
"""
import os
from dotenv import load_dotenv
import logging
from typing import List, Union, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

load_dotenv()

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

# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------
LLM_MODEL: str = os.getenv("LLM_MODEL")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ---------------------------------------------------------------------------
# Vector Database (Qdrant)
# ---------------------------------------------------------------------------
QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME: str = "products"
EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

# ---------------------------------------------------------------------------
# Data Field Mappings
# These tell the LLM how to read product payloads returned from Qdrant.
# Override via .env to adapt to any shop's data schema.
# ---------------------------------------------------------------------------
MAPPING_FIELD_NAME: str = os.getenv("MAPPING_FIELD_NAME", "name")
MAPPING_FIELD_DESC: str = os.getenv("MAPPING_FIELD_DESC", "description")
MAPPING_FIELD_PRICE: str = os.getenv("MAPPING_FIELD_PRICE", "price")
MAPPING_FIELD_ID: str = os.getenv("MAPPING_FIELD_ID", "identifier")

# ---------------------------------------------------------------------------
# Shop URL Templates
# build_url() in tools.py replaces {{slug}} / {{query}} at runtime.
#
# Next.js flat-URL defaults (current storefront):
#   SHOP_PRODUCT_TEMPLATE=/{{slug}}
#
# WooCommerce example:
#   SHOP_PRODUCT_TEMPLATE=/product/{{slug}}/
#   SHOP_CATEGORY_TEMPLATE=/product-category/{{slug}}/
#   SHOP_SEARCH_TEMPLATE=/?s={{query}}
# ---------------------------------------------------------------------------
SHOP_BASE_URL: str = os.getenv("SHOP_BASE_URL", "").rstrip("/")
SHOP_PRODUCT_TEMPLATE: str = os.getenv("SHOP_PRODUCT_TEMPLATE", "/{{slug}}")
SHOP_CATEGORY_TEMPLATE: str = os.getenv("SHOP_CATEGORY_TEMPLATE", "/{{slug}}")
SHOP_SEARCH_TEMPLATE: str = os.getenv("SHOP_SEARCH_TEMPLATE", "/products?search={{query}}")

# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
