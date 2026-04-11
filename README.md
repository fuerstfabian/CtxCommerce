# CtxCommerce

A lightweight, highly decoupled, AI-driven sales agent for e-commerce. Built with hybrid search via Qdrant, a stateless FastAPI backend with Pydantic AI (Gemini), and a domain-agnostic Vanilla JavaScript frontend widget.

## 🚀 Key Features

- **Store & Domain Agnostic**: The frontend widget is purely Vanilla JS/CSS and injects into *any* existing storefront (Next.js, Shopify, Magento) via a simple `<script>` tag.
- **Smart DOM Context Scanning**: The widget autonomously reads the store's current SEO data (`<script type="application/ld+json">`) to understand what the user is looking at, without requiring complex API integrations.
- **Action Execution (Browser Control)**: The agent can trigger proactive browser interactions. By attaching `data-agent-id` to buttons (like "Add to Cart"), the LLM can click them via structured output.
- **Proactive Navigation**: The agent understands intent and can redirect the user automatically to recommended product pages.
- **Token-Efficient Conversational Memory**: The backend tracks history to maintain conversational context (e.g., "How heavy is that?"), heavily optimizing API usage token costs.

## 🏗️ Architecture

1. **Backend (`/backend`)**: FastAPI server implementing structured outputs with Pydantic AI. Connects to the local Vector DB to execute natural language multi-filtered product searches.
2. **Vector Database (`Qdrant Docker`)**: Stores normalized product metadata (Synthetic PIM Export) and FastEmbed vectors for zero-latency, local context retrieval.
3. **Frontend Mock (`/storefront`)**: A sterile "Lab" Next.js (App Router, Tailwind CSS, Node 20+) to demonstrate the widget in a modern environment.
4. **The Widget (`/frontend/widget.js`)**: The injected UI layer that manages the chat flow, DOM extraction, and Action execution payloads.

## ⚙️ Prerequisites

- **Node.js**: v20 or higher (Required for Next.js 15 Turbopack compilation).
- **Python**: v3.10 or higher.
- **Docker**: For running the local Qdrant Vector Database instance.

## 📦 Local Setup & Installation

### 1. Boot up the Vector Database
Open a terminal and start the Qdrant container:
```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

### 2. Prepare the Python Backend
In a new terminal wrapper, initialize your environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```
Copy your API keys:
```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY
```

Ingest the PIM synthetic product data into Qdrant (Only needs to be done once!):
```bash
python scripts/ingest_data.py
```

Start the FastAPI application:
```bash
uvicorn backend.main:app --reload
```

### 3. Run the Next.js Storefront (Sterile Lab)
In a third terminal window:
```bash
cd storefront
nvm use 20 # Highly recommended to enforce Node 20+
npm install
npm run dev
```

Visit the application at `http://localhost:3000`. You can interact with the agent natively on the Homepage (for general search tests) and on detailed Product Pages (for DOM context injection and DOM interactions).
