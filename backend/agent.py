"""
AI Agent logic for CtxCommerce using Pydantic AI.
Responsible for processing chat messages, invoking tools, and generating responses.
"""
import os
import logging
from typing import Optional, Union, Dict, Any, List

from pydantic_ai import Agent, RunContext
import json
from dotenv import load_dotenv

from backend.database import search_products
from pydantic import BaseModel, Field
from backend.models import ChatResponse

class AgentResult(BaseModel):
    """Structured output from the Pydantic AI agent."""
    reply: str = Field(..., description="The conversational response to the user.")
    action_id: Optional[str] = Field(None, description="The data-agent-id of the element to click, if an action is needed.")
    redirect_url: Optional[str] = Field(None, description="The URL to redirect the user to, e.g., ?product_id=X.")

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Dynamically load the model name from the environment variable (fallback to gemini-3-flash-preview)
model_name = os.getenv("LLM_MODEL", "gemini-3-flash-preview")

system_prompt = """
Role: Expert E-Commerce Advisor.

You are an expert sales advisor for an online store. Your goal is to guide users, 
answer their questions, and help them find the right products.

CRITICAL INSTRUCTIONS FOR YOUR BEHAVIOR:
1. DOM CONTEXT: Pay strict attention to the provided DOM context. It tells you what the user is currently looking at. Do not ask for information you can see in the context.
2. TOOL CALLING (CRITICAL): The product database is STRICTLY IN ENGLISH. Whenever you use the `search_store_products` tool, you MUST translate the user's intent into an ENGLISH search query. Never send German or other languages to the search tool!
3. READING PRODUCT DATA: When you use the search tool, it returns products in a deeply nested PIM JSON format. 
   - You MUST look inside `values.name` to find the product name.
   - You MUST look inside `values.description` to find the description.
   - You MUST look inside `values.weight_grams` for the weight.
4. SEMANTIC FLEXIBILITY: Be smart about product categories! If a user asks for a sleeping bag, a "Quilt" is a perfect and valid recommendation. If they ask for a sleeping pad, look for "Sleeping Pad" or similar terms.
5. LANGUAGE: The product data is in English, but you MUST translate your final advice and the product descriptions naturally into the language the user is speaking (e.g., German, French, Spanish, etc.).
6. CONVERSATIONAL TONE (CRITICAL): NEVER present product data as rigid lists or bullet points (e.g., avoiding formats like "Name: [X], Description: [Y]"). Instead, weave the product names, weights, and features naturally into a flowing, conversational paragraph, just like a human sales expert would speak to a customer in a physical store.
7. ACTION EXECUTION: The DOM context provides a list of interactiveElements with their corresponding data-agent-ids. If the user asks you to interact with the page (e.g., 'add to cart', 'click the button'), you MUST find the correct ID from the context and include it in your structured output as action_id. If no action is needed, leave it null.
8. NAVIGATION: If the user explicitly asks to see, open, or go to a product you are recommending, you must set the redirect_url to its exact "identifier" string from the PIM JSON payload (e.g. "nemo-hornet-osmo-2"). CRITICAL: Because you might forget the exact JSON identifier from a previous search, you MUST use the `search_store_products` tool AGAIN to find the product and read its exact "identifier" string before redirecting. NEVER guess or slugify the product name! Do NOT add any URL paths like /product/ or ?product_id=.
"""

# Initialize the Pydantic AI Agent
agent_model = f"google-gla:{model_name}" if not model_name.startswith("google-gla") else model_name

agent = Agent(
    model=agent_model,
    system_prompt=system_prompt,
    output_type=AgentResult
)

@agent.tool
async def search_store_products(ctx: RunContext, query: str) -> List[Dict[str, Any]]:
    """
    Search for products in the store based on a natural language query.
    
    CRITICAL: Translate your search query to ENGLISH before calling this tool!
    Example: If the user wants a "Schlafsack", the query MUST be "sleeping bag".
    
    Args:
        query: The translated, strictly ENGLISH search term.
    """
    return await search_products(query)

async def get_chat_history(session_id: str, redis_client) -> List[Dict[str, str]]:
    """Retrieve chat history natively formatted from Redis."""
    if not redis_client:
        return []
    try:
        data = await redis_client.get(f"session:{session_id}")
        if data:
            return json.loads(data)
    except Exception as e:
        logger.error(f"Failed to retrieve chat history from Redis: {e}")
    return []

async def save_chat_history(session_id: str, history_list: List[Dict[str, str]], redis_client):
    """Save plain text chat history back to Redis with a 24-hour TTL."""
    if not redis_client:
        return
    try:
        data = json.dumps(history_list)
        # 86400 seconds = 24 hours
        await redis_client.setex(f"session:{session_id}", 86400, data)
    except Exception as e:
        logger.error(f"Failed to save chat history to Redis: {e}")

async def process_chat(
    message: str, 
    context: Optional[Union[Dict[str, Any], str]] = None, 
    session_id: Optional[str] = None, 
    redis_client = None
) -> ChatResponse:
    """
    Processes a chat message through the Pydantic AI agent, incorporating the DOM context and Redis history.
    """
    prompt = f"User Message:\n{message}\n"
    if context:
        prompt += f"\nCurrent DOM Context:\n{context}\n"
        
    # Fetch history if Redis is active
    history = []
    if session_id and redis_client:
        history = await get_chat_history(session_id, redis_client)
        
    if history:
        history_str = "\n".join([f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in history])
        prompt = f"--- Previous Conversation History ---\n{history_str}\n\n" + prompt
        
    try:
        logger.info(f"Running agent with model string: {agent_model}")
        result = await agent.run(prompt)
        
        # Build text string to save array
        if session_id and redis_client:
            history.append({"role": "user", "content": message})
            history.append({"role": "agent", "content": result.output.reply})
            if len(history) > 12:
                history = history[-12:]
            await save_chat_history(session_id, history, redis_client)

        return ChatResponse(
            agent_reply=result.output.reply,
            action_target_id=result.output.action_id,
            redirect_url=result.output.redirect_url
        )
    except Exception as e:
        logger.error(f"Error during agent execution: {e}")
        return ChatResponse(
            agent_reply="I apologize, but I encountered an error while processing your request. Please try again later.",
            action_target_id=None,
            redirect_url=None
        )
