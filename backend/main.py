"""
Main FastAPI application module for CtxCommerce.
"""
import logging
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.models import ChatRequest, ChatResponse
from backend.agent import process_chat

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CtxCommerce API",
    description="Backend API for the lightweight, domain-agnostic CtxCommerce AI sales agent.",
    version="1.0.0"
)

# Configure CORS (allow all origins for web widget access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Endpoint to receive chat messages and DOM context, 
    process them via the AI agent, and return a response.
    """
    logger.info(f"Received chat request from user.")
    
    try:
        # Call the asynchronous process_chat function from agent.py
        return await process_chat(
            message=request.user_message,
            context=request.dom_context,
            chat_history=request.chat_history
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while processing chat.")

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}
