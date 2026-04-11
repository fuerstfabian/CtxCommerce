"""
Main FastAPI application module for CtxCommerce.
"""
import logging
import os
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import redis.asyncio as redis

from backend.models import ChatRequest, ChatResponse
from backend.agent import process_chat, get_chat_history

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing Redis connection...")
    app.state.redis = redis.from_url("redis://localhost:6379", decode_responses=True)
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

# Configure CORS (Dynamic with fallback)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    fast_request: Request, 
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
        return await process_chat(
            message=request.user_message,
            context=request.dom_context,
            session_id=x_session_id,
            redis_client=fast_request.app.state.redis
        )
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
