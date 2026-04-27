"""
Pydantic AI tool definitions, output schemas, and URL builder for CtxCommerce.

Responsibilities:
  - All Pydantic output models (RedirectAction, AgentResult).
  - The build_url() helper that translates entity types + slugs into
    root-relative URL paths using templates from config.py.
  - The raw async tool function consumed by agent.py.

Note: @agent.tool registration cannot happen here because the Agent instance
lives in agent.py (to avoid a circular import). The bare function is defined
here and registered programmatically in agent.py via agent.tool(fn).
"""
import logging
from typing import Optional, Dict, Any, List, Literal

from pydantic import BaseModel, Field
from pydantic_ai import RunContext

from backend.config import (
    SHOP_BASE_URL,
    SHOP_PRODUCT_TEMPLATE,
    SHOP_CATEGORY_TEMPLATE,
    SHOP_SEARCH_TEMPLATE,
)
from backend.database import search_products

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Output Models
# ---------------------------------------------------------------------------

class RedirectAction(BaseModel):
    """
    Structured redirect intent emitted by the agent.
    The agent always outputs a bare slug or query — never a full URL.
    URL construction is delegated server-side to build_url().
    """
    entity_type: Literal['product', 'category', 'search', 'system'] = Field(
        ...,
        description=(
            "The type of destination: "
            "'product' for a single product detail page, "
            "'category' for a category listing page, "
            "'search' for a search results page, "
            "'system' for any other internal page."
        ),
    )
    slug_or_query: str = Field(
        ...,
        description=(
            "For entity_type 'product' or 'category': the bare slug exactly as it appears "
            "in the database (e.g. 'patagonia-houdini-jacket' or 'jackets'). "
            "For entity_type 'search': the raw search query string (e.g. 'lightweight tent'). "
            "NEVER include URL prefixes, slashes, or query parameters here."
        ),
    )


class AgentResult(BaseModel):
    """Structured output contract for the Pydantic AI agent."""

    is_in_scope: bool = Field(
        ...,
        description=(
            "Evaluate if the user query is related to shopping, products, "
            "or UI navigation BEFORE answering."
        ),
    )
    intent_category: str = Field(
        ...,
        description=(
            "Classify the intent "
            "(e.g., 'product_search', 'chitchat', 'malicious_injection', 'out_of_scope')."
        ),
    )
    reply: str = Field(
        ...,
        description=(
            "The conversational response to the user. "
            "If is_in_scope is false, reply with a polite refusal "
            "strictly IN THE LANGUAGE THE USER IS SPEAKING."
        ),
    )
    action_id: Optional[str] = Field(
        None,
        description=(
            "The data-agent-id of the DOM element to click, if a page interaction is needed. "
            "Must be null if is_in_scope is false. NEVER put a slug or URL here."
        ),
    )
    redirect_action: Optional[RedirectAction] = Field(
        None,
        description=(
            "Populate this when the user should be navigated to a new page. "
            "Use 'product' + the exact identifier slug for product pages, "
            "'category' + the category slug for listings, "
            "'search' + the query for search results. "
            "Leave null if no navigation is required. Must be null if is_in_scope is false."
        ),
    )


# ---------------------------------------------------------------------------
# URL Builder
# ---------------------------------------------------------------------------

def build_url(entity_type: str, identifier: str) -> str:
    """
    Builds a fully-qualified shop URL by combining SHOP_BASE_URL with the
    path template defined in config.py.

    The identifier is defensively stripped of leading/trailing slashes to
    prevent protocol-relative URL bugs (e.g. '//jackets' → 'http://jackets/').

    Templates use {{slug}} or {{query}} as placeholders.

    Args:
        entity_type: One of 'product', 'category', 'search', 'system'.
        identifier:  The validated bare slug or raw search-query string.

    Returns:
        A fully-qualified URL (e.g. 'http://localhost:3000/jackets').

    Examples (WooCommerce config):
        build_url('product',  'patagonia-jacket')  -> 'https://shop.com/product/patagonia-jacket/'
        build_url('category', 'tents')             -> 'https://shop.com/product-category/tents/'
        build_url('search',   'ultralight tent')   -> 'https://shop.com/?s=ultralight tent'
    """
    clean = identifier.strip("/")

    if entity_type == "product":
        path = SHOP_PRODUCT_TEMPLATE.replace("{{slug}}", clean)
    elif entity_type == "category":
        path = SHOP_CATEGORY_TEMPLATE.replace("{{slug}}", clean)
    elif entity_type == "search":
        path = SHOP_SEARCH_TEMPLATE.replace("{{query}}", clean)
    else:
        # 'system' or unknown: treat identifier as a bare relative path
        path = f"/{clean}"

    return SHOP_BASE_URL + path


# ---------------------------------------------------------------------------
# Agent Tool Functions
# ---------------------------------------------------------------------------

async def search_store_products(ctx: RunContext, query: str) -> List[Dict[str, Any]]:
    """
    Search for products in the store based on a natural language query.

    CRITICAL: Translate your search query to ENGLISH before calling this tool!
    Example: If the user wants a "Schlafsack", the query MUST be "sleeping bag".

    Args:
        query: The translated, strictly ENGLISH search term.
    """
    return await search_products(query)
