"""
Security and validation guardrails for the CtxCommerce AI Agent.

Isolates all slug verification and fuzzy-match correction logic.
No business logic is altered — only the module boundaries have changed.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pre-Flight LLM Security Classifier
# ---------------------------------------------------------------------------

async def check_malicious_intent(user_message: str) -> bool:
    """
    Lightweight LLM pre-flight classifier that detects prompt-injection
    and jailbreak attempts before the main agent processes the message.

    Uses the same Gemini Flash Lite model via google.genai for minimal
    latency. The prompt template is maintained in prompts.py (SoC).

    Returns True if the message is classified as malicious, False otherwise.
    Fails open (returns False) on errors to avoid blocking legitimate requests.
    """
    # Deferred imports to prevent circular import chains and keep
    # guardrails.py free of top-level internal dependencies.
    from google import genai
    from backend.config import LLM_MODEL, GEMINI_API_KEY
    from backend.prompts import PRE_FLIGHT_PROMPT

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = PRE_FLIGHT_PROMPT.format(user_message=user_message)
        response = await client.aio.models.generate_content(
            model=LLM_MODEL,
            contents=prompt,
        )
        classification = response.text.strip().upper()
        is_malicious = "MALICIOUS" in classification
        if is_malicious:
            logger.warning("Pre-flight classifier flagged message as MALICIOUS.")
        return is_malicious
    except Exception as e:
        logger.error(f"Pre-flight classifier error: {e}")
        return False


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _slug_similarity(slug_a: str, slug_b: str) -> float:
    """
    Domain-agnostic word-overlap similarity between two hyphenated slugs.
    Returns a ratio between 0.0 (no overlap) and 1.0 (identical words).
    Used to distinguish hallucinated product identifiers from category slugs.

    E.g. 'patagonia-houdini-wind-jacket' vs 'patagonia-houdini-jacket' -> high overlap (correction)
         'jackets' vs 'norrona-falketind-gore-tex' -> zero overlap (category, pass through)
    """
    words_a = set(slug_a.split('-'))
    words_b = set(slug_b.split('-'))
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    return len(intersection) / max(len(words_a), len(words_b))


# ---------------------------------------------------------------------------
# Public Guardrail
# ---------------------------------------------------------------------------

async def validate_slug(raw_slug: Optional[str]) -> Optional[str]:
    """
    Server-side guardrail: Validates and potentially corrects a bare slug
    emitted by the LLM for 'product' or 'category' entity types.

    The slug must already be stripped of any URL prefixes before calling this
    function — the LLM is now instructed to output only the slug itself.

    Strategy:
    1. Block ctx-el-* agent IDs (these belong in action_id, not redirect_action).
    2. Check if the slug matches a real product identifier in Qdrant (exact match).
    3. If not found, fuzzy-search and only auto-correct if the result is similar
       (indicating a hallucinated variant). Dissimilar results mean the slug is
       probably a category or system path — pass it through for the frontend.
    """
    if not raw_slug:
        return None

    slug = raw_slug.strip()

    # 1. Block agent IDs — these belong in action_id, not redirect_action
    if slug.startswith('ctx-el-'):
        logger.warning(f"Guardrail blocked ctx-el agent ID in redirect_action: {slug}")
        return None

    # 2. Verify against Qdrant: does this identifier actually exist?
    # Imports are deferred to function scope to prevent circular import chains.
    # guardrails.py has no top-level internal dependencies by design.
    from backend.database import search_products, qdrant_client, COLLECTION_NAME

    if qdrant_client:
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            exact_match = await qdrant_client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[FieldCondition(key="identifier", match=MatchValue(value=slug))]
                ),
                limit=1
            )
            if exact_match[0]:
                logger.info(f"Guardrail: slug '{slug}' verified in database.")
                return slug

            # Not an exact match — fuzzy-search to detect possible hallucinations
            search_query = slug.replace('-', ' ')
            search_results = await search_products(search_query)
            if search_results and not search_results[0].get('error'):
                corrected_id = search_results[0].get('identifier')
                if corrected_id and corrected_id != slug:
                    similarity = _slug_similarity(slug, corrected_id)
                    if similarity >= 0.4:
                        # High overlap = hallucinated variant of a real product -> correct it
                        logger.warning(
                            f"Guardrail: '{slug}' NOT found. "
                            f"Corrected -> '{corrected_id}' (similarity={similarity:.2f})"
                        )
                        return corrected_id
                    else:
                        # Low overlap = likely a category slug, not a product -> pass through
                        logger.info(
                            f"Guardrail: '{slug}' not in DB, dissimilar to '{corrected_id}' "
                            f"(similarity={similarity:.2f}). Passing through as-is."
                        )
        except Exception as e:
            logger.error(f"Guardrail validation error: {e}")

    # Qdrant unavailable or category slug — pass through for frontend routing
    return slug
