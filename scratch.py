import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

from backend.agent import agent
import logging

logging.basicConfig(level=logging.INFO)

async def test_agent():
    print("Testing Agent...")
    result = await agent.run("Bring mich auf die Seite von der Patagonie Houdini Wind Jacket")
    print("\n--- AGENT RESULT ---")
    print(json.dumps(result.output.model_dump(), indent=2))
    print("--------------------\n")

asyncio.run(test_agent())
