"""
AI Agent Orchestrator for CtxCommerce.

Lightweight controller that:
  1. Initialises the Pydantic AI Agent using config and prompts.
  2. Registers tool functions from tools.py.
  3. Exposes process_chat() and get_chat_history() to main.py.

No business logic lives here — it is delegated to the specialist modules.
"""
import json
import logging
from typing import Optional, Union, Dict, Any, List

from pydantic_ai import Agent

from backend.config import LLM_MODEL
from backend.models import ChatResponse
from backend.prompts import SYSTEM_PROMPT
from backend.tools import AgentResult, build_url, search_store_products
from backend.guardrails import validate_slug, check_malicious_intent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Agent Initialization
# ---------------------------------------------------------------------------

_agent_model = (
    f"google-gla:{LLM_MODEL}" if not LLM_MODEL.startswith("google-gla") else LLM_MODEL
)

agent = Agent(
    model=_agent_model,
    system_prompt=SYSTEM_PROMPT,
    output_type=AgentResult,
)

# Register tool functions defined in tools.py.
# Programmatic registration avoids passing the Agent instance into tools.py,
# which would create a circular import.
agent.tool(search_store_products)


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _sanitize_tags(text: str) -> str:
    """
    Strip <user_input> / </user_input> markers from arbitrary text.
    Prevents XML-tag injection where a user closes the tag early
    and injects pseudo-system instructions after it.
    """
    return text.replace("<user_input>", "").replace("</user_input>", "")


# ---------------------------------------------------------------------------
# Session / History Helpers
# ---------------------------------------------------------------------------

async def get_chat_history(session_id: str, redis_client) -> List[Dict[str, str]]:
    """Retrieve the conversation history for a session from Redis."""
    if not redis_client:
        return []
    try:
        data = await redis_client.get(f"session:{session_id}")
        if data:
            return json.loads(data)
    except Exception as e:
        logger.error(f"Failed to retrieve chat history from Redis: {e}")
    return []


async def save_chat_history(
    session_id: str,
    history_list: List[Dict[str, str]],
    redis_client,
) -> None:
    """Persist the conversation history for a session to Redis (24 h TTL)."""
    if not redis_client:
        return
    try:
        await redis_client.setex(
            f"session:{session_id}", 86400, json.dumps(history_list)
        )
    except Exception as e:
        logger.error(f"Failed to save chat history to Redis: {e}")


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

async def process_chat(
    message: str,
    context: Optional[Union[Dict[str, Any], str]] = None,
    session_id: Optional[str] = None,
    redis_client=None,
) -> ChatResponse:
    """
    Processes a single chat message through the Pydantic AI agent,
    incorporating DOM context and Redis-backed conversation history.

    Security pipeline:
      1. Sanitize XML tags from user message.
      2. Run LLM pre-flight classifier (check_malicious_intent).
      3. Execute main agent with structured output.
      4. Server-side enforcement of is_in_scope.

    Called exclusively by main.py's API endpoint.
    """
    # --- 1. XML-Tag Sanitization ---
    sanitized_message = _sanitize_tags(message)

    # --- 2. Pre-Flight Security Check ---
    if await check_malicious_intent(sanitized_message):
        logger.warning(f"Pre-flight blocked malicious message. Session: {session_id}")
        return ChatResponse(
            agent_reply="error_malicious",
            action_target_id=None,
            redirect_url=None,
        )

    # --- Build prompt ---
    prompt = f"User Message:\n<user_input>{sanitized_message}</user_input>\n"
    if context:
        prompt += f"\nCurrent DOM Context:\n{context}\n"

    # Fetch and sanitize history
    history: List[Dict[str, str]] = []
    if session_id and redis_client:
        history = await get_chat_history(session_id, redis_client)

    if history:
        sanitized_history = [
            {
                "role": msg.get("role", "user"),
                "content": _sanitize_tags(msg.get("content", "")),
            }
            for msg in history
        ]
        history_str = "\n".join(
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in sanitized_history
        )
        prompt = f"--- Previous Conversation History ---\n{history_str}\n\n" + prompt

    try:
        logger.info(f"Running agent with model: {_agent_model}")
        result = await agent.run(prompt)

        # --- 4. Server-side is_in_scope enforcement ---
        if not result.output.is_in_scope:
            logger.info(
                f"Agent classified message as out-of-scope "
                f"(intent: {result.output.intent_category})"
            )
            # Discard the LLM's reply entirely; return an error key
            # so the frontend can display a localized refusal.
            return ChatResponse(
                agent_reply="error_out_of_scope",
                action_target_id=None,
                redirect_url=None,
            )

        # --- Redirect resolution ---
        final_url: Optional[str] = None
        redirect_action = result.output.redirect_action

        if redirect_action:
            entity_type = redirect_action.entity_type
            raw_slug = redirect_action.slug_or_query

            if entity_type in ("product", "category"):
                # Run the Qdrant guardrail for product/category slugs only
                validated_slug = await validate_slug(raw_slug)
                if validated_slug and validated_slug != raw_slug:
                    logger.warning(
                        f"Guardrail corrected slug: '{raw_slug}' -> '{validated_slug}'"
                    )
            else:
                # Search query or system path — pass through without Qdrant checks
                validated_slug = raw_slug

            if validated_slug:
                final_url = build_url(entity_type, validated_slug)
                logger.info(
                    f"Built redirect URL: entity_type='{entity_type}', url='{final_url}'"
                )

        # --- Persist session history ---
        if session_id and redis_client:
            history.append({"role": "user", "content": message})
            history.append({"role": "agent", "content": result.output.reply})
            if len(history) > 12:
                history = history[-12:]
            await save_chat_history(session_id, history, redis_client)

        return ChatResponse(
            agent_reply=result.output.reply,
            action_target_id=result.output.action_id,
            redirect_url=final_url,
        )

    except Exception as e:
        logger.error(f"Error during agent execution: {e}")
        return ChatResponse(
            agent_reply="error_processing",
            action_target_id=None,
            redirect_url=None,
        )
