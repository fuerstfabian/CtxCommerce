"""
Main FastAPI application module for CtxCommerce.
"""
import os
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis.asyncio as redis

from backend.config import REDIS_URL, ALLOWED_ORIGINS
from backend.models import ChatRequest, ChatResponse
from backend.agent import process_chat, get_chat_history, save_chat_history

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter — keyed on client IP
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Initializing Redis connection to {REDIS_URL}...")
    app.state.redis = redis.from_url(REDIS_URL, decode_responses=True)
    yield
    # Shutdown actions
    logger.info("Closing Redis connection...")
    await app.state.redis.close()

# Initialize FastAPI app
app = FastAPI(
    title="CtxCommerce API",
    description="Backend API for the lightweight, domain-agnostic CtxCommerce AI sales agent.",
    version="1.0.0",
    lifespan=lifespan
)

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files directory
# Resolves to the 'frontend' folder in the root of the project (one level above 'backend')
static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Configure CORS — origin sourced from config.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("15/minute")
async def chat_endpoint(
    request: Request,
    body: ChatRequest,
    background_tasks: BackgroundTasks,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
) -> ChatResponse:
    """
    Endpoint to receive chat messages and DOM context, 
    process them via the AI agent, and return a response.
    Requires an X-Session-ID header for Redis state management.
    """
    if not x_session_id:
        logger.warning("Rejected request: Missing X-Session-ID header")
        raise HTTPException(status_code=400, detail="X-Session-ID header is missing.")

    logger.info(f"Received chat request from user. Session ID: {x_session_id}")
    
    try:
        # Call the asynchronous process_chat function from agent.py
        response, new_history = await process_chat(
            message=body.user_message,
            context=body.dom_context,
            session_id=x_session_id,
            redis_client=request.app.state.redis
        )
        
        # Persist history asynchronously
        background_tasks.add_task(save_chat_history, x_session_id, new_history, request.app.state.redis)
        
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while processing chat.")

@app.get("/api/chat/history")
async def chat_history_endpoint(
    fast_request: Request,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
) -> Dict[str, Any]:
    """
    Returns visual chat history for the frontend widget.
    """
    if not x_session_id:
        return {"history": []}
    
    redis_client = fast_request.app.state.redis
    history = await get_chat_history(x_session_id, redis_client)
    
    return {"history": history}

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}
