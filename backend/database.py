"""
Database interaction module for CtxCommerce.
Handles connections and queries to the local Qdrant Vector Database
using FastEmbed for on-the-fly query vectorization.

Connection parameters are sourced exclusively from config.py.
"""
import logging
from typing import List, Dict, Any

from qdrant_client import AsyncQdrantClient
from fastembed import TextEmbedding

from backend.config import QDRANT_URL, COLLECTION_NAME, EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Initialize singletons for the Qdrant Client and Embedding Model
# Initialized globally so they are reused across requests, minimizing latency.
try:
    qdrant_client = AsyncQdrantClient(url=QDRANT_URL)
    embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)
except Exception as e:
    logger.error(f"Critical error initializing Database services: {e}")
    # Proceed without crashing entirely to allow the app to boot, 
    # but subsequent calls to search_products will fail gracefully.
    qdrant_client = None
    embedding_model = None


async def search_products(query: str) -> List[Dict[str, Any]]:
    """
    Performs a hybrid search for products based on the query string.
    Embeds the incoming text query and queries the Qdrant database.
    
    Args:
        query (str): The search term provided by the agent.
        
    Returns:
        List[Dict[str, Any]]: A list of product dictionaries matching the query (payloads).
    """
    logger.info(f"Executing vector search for query: '{query}'")
    
    if not qdrant_client or not embedding_model:
        logger.error("Database or Embedding Model is not initialized.")
        return [{"error": "Search is currently unavailable."}]
        
    try:
        # 1. Embed the search query
        # FastEmbed's embed returns a generator, we take the first (and only) vector
        generator = embedding_model.embed([query])
        query_vector = list(generator)[0]
        
        # Convert vector to standard Python list for Qdrant
        query_vector_list = query_vector.tolist() if hasattr(query_vector, 'tolist') else list(query_vector)

        # 2. Query Qdrant
        search_result = await qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector_list,
            limit=3
        )
        
        # 3. Extract the payload dictionaries
        results: List[Dict[str, Any]] = []
        for scored_point in search_result.points:
            if scored_point.payload:
                results.append(scored_point.payload)
                
        logger.info(f"Search returned {len(results)} relevant products.")
        return results

    except Exception as e:
        logger.error(f"Error during Qdrant search execution: {e}")
        return [{"error": "Failed to fetch products from the database."}]
