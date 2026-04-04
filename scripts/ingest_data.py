"""
Data Ingestion Script for CtxCommerce.
Loads product data from a JSON file, generates vectors using FastEmbed, 
and stores both the vector and raw payload in a local Qdrant container.
"""
import json
import os
import logging
import asyncio
from typing import List, Dict, Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from fastembed import TextEmbedding

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = "products"
# Assuming script runs from root or scripts dir, navigate to data file
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT_DIR, "data", "pim-synthetic-export.json")
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384  # BAAI/bge-small-en-v1.5 has 384 dimensions

async def ingest_data() -> None:
    """
    Reads product data, generates vector embeddings, and upserts them to the Qdrant database.
    Strictly separates the generated vectors from the product payload.
    """
    logger.info("Starting ingestion process...")
    
    # 1. Check if data file exists
    if not os.path.isfile(DATA_PATH):
        logger.error(f"Data file not found at {DATA_PATH}. Please ensure the file exists.")
        return
        
    # 2. Load the JSON data
    logger.info(f"Loading data from {DATA_PATH}...")
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            products: List[Dict[str, Any]] = json.load(f)
        logger.info(f"Loaded {len(products)} products.")
    except Exception as e:
        logger.error(f"Failed to read or parse JSON file: {e}")
        return

    # 3. Initialize FastEmbed TextEmbedding model
    logger.info(f"Initializing FastEmbed model: {EMBEDDING_MODEL} (this will download model weights on first run)")
    try:
        embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)
    except Exception as e:
        logger.error(f"Failed to initialize FastEmbed: {e}")
        return

    # 4. Initialize Qdrant Client
    logger.info(f"Connecting to Qdrant at {QDRANT_URL}")
    try:
        client = AsyncQdrantClient(url=QDRANT_URL)
        # Ping the server to ensure connection
        await client.get_collections()
    except Exception as e:
        logger.error(f"Failed to connect to Qdrant. Are you sure the Docker container is running? Error: {e}")
        return

    # 5. Create Collection if it doesn't exist
    try:
        exists = await client.collection_exists(COLLECTION_NAME)
        if not exists:
            logger.info(f"Creating '{COLLECTION_NAME}' collection in Qdrant with vector size {VECTOR_SIZE}...")
            await client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            )
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' already exists. We will upsert into it.")
    except Exception as e:
        logger.error(f"Failed during collection manipulation: {e}")
        return

    # 6. Prepare Points for Upsert
    logger.info("Generating embeddings and preparing distinct Vector / Payload structures...")
    points: List[PointStruct] = []
    
    # Generate meaningful text fields to embed for each product
    documents_to_embed = []
    for product in products:
        name = product.get("name", "")
        description = product.get("description", "")
        category = product.get("category", "")
        
        # Combine contextual fields into one rich textual representation
        doc_string = f"Name: {name}\nCategory: {category}\nDescription: {description}"
        documents_to_embed.append(doc_string)
        
    # Compute vectors
    logger.info("Computing vectors over all documents...")
    embeddings_generator = embedding_model.embed(documents_to_embed)
    embeddings = list(embeddings_generator)
    
    # Assemble Qdrant PointStructs
    for idx, (product, vector) in enumerate(zip(products, embeddings)):
        # Convert NumPy array context to standard list
        vector_list = vector.tolist() if hasattr(vector, 'tolist') else list(vector)
        
        # Structure strictly separates Vector and the entire origin JSON as Payload
        point = PointStruct(
            id=idx + 1,  # Unsigned Int ID for the Qdrant point
            vector=vector_list,
            payload=product
        )
        points.append(point)

    # 7. Upload to Qdrant iteratively
    logger.info(f"Upserting {len(points)} points to Qdrant in batches...")
    try:
        chunk_size = 100
        for i in range(0, len(points), chunk_size):
            batch = points[i:i + chunk_size]
            await client.upsert(
                collection_name=COLLECTION_NAME,
                points=batch
            )
            logger.info(f"Upserted items {i} to {i + len(batch)}...")
        
        logger.info("Data ingestion completed successfully! Vectors and payload separated.")
        print("\n✅ SUCCESS: Vector data successfully loaded into Qdrant!")
    except Exception as e:
        logger.error(f"Failed during UPSERT: {e}")

if __name__ == "__main__":
    asyncio.run(ingest_data())
