"""
AI Agent logic for CtxCommerce using Pydantic AI.
Responsible for processing chat messages, invoking tools, and generating responses.
"""
import os
import logging
from typing import Optional, Union, Dict, Any, List

from pydantic_ai import Agent, RunContext
from dotenv import load_dotenv

from backend.database import search_products

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Dynamically load the model name from the environment variable (fallback to gemini-3-flash-preview)
model_name = os.getenv("LLM_MODEL", "gemini-3-flash-preview")

system_prompt = """
Role: Expert E-Commerce Advisor.

You are an expert sales advisor for an online store. Your goal is to guide users, 
answer their questions, and help them find the right products.

Pay STRICT ATTENTION to the provided DOM context (e.g., current product ID, page title)! 
The DOM context tells you what the user is currently looking at. Use this information 
to provide highly contextual and helpful answers without asking them for information 
you already have.
"""

# Initialize the Pydantic AI Agent
# Under standard configuration with google-genai, the model string determines the provider.
# Specifying `google-gla:model_name` ensures it evaluates as a Google model using the GenAI SDK.
agent_model = f"google-gla:{model_name}" if not model_name.startswith("google-gla") else model_name

agent = Agent(
    model=agent_model,
    system_prompt=system_prompt,
)

@agent.tool
async def search_store_products(ctx: RunContext, query: str) -> List[Dict[str, Any]]:
    """
    Search for products in the store based on a natural language query.
    
    Args:
        query: The search term to find relevant products in the store's inventory.
    """
    return await search_products(query)

async def process_chat(message: str, context: Optional[Union[Dict[str, Any], str]] = None) -> str:
    """
    Processes a chat message through the Pydantic AI agent, incorporating the DOM context.
    
    Args:
        message (str): The user's input message.
        context (Optional[Union[Dict[str, Any], str]]): The current DOM context from the user's browser.
        
    Returns:
        str: The AI agent's response.
    """
    # Construct a complete prompt including the context if provided
    prompt = f"User Message:\n{message}\n"
    if context:
        prompt += f"\nCurrent DOM Context:\n{context}\n"
        
    try:
        # Execute the agent
        logger.info(f"Running agent with model string: {agent_model}")
        result = await agent.run(prompt)
        return result.output
    except Exception as e:
        logger.error(f"Error during agent execution: {e}")
        return "I apologize, but I encountered an error while processing your request. Please try again later."
