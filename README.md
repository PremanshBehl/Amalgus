# Smart Glass Product Finder (Prototype)

## Project Overview
Smart Glass Product Finder is a minimal prototype of an AI-powered “Smart Product Discovery & Intelligent Matching” system for a glass marketplace (B2B/B2C).  
A user describes their requirement in natural language, and the backend ranks the top matching products from a static dataset using an LLM.

## Tech Stack
- Frontend: React + Tailwind (single page)
- Backend: Node.js + Express
- AI: OpenAI API (Chat Completions)
- Data: Static JSON (`/data/products.json`)

## Folder Structure
- `frontend/` - React + Tailwind app
- `backend/` - Express API with `/match`
- `data/products.json` - Mock glass product dataset

## Setup (Local, Runnable)
### 1) OpenAI API key
Create a `.env` file in `backend/`:
```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

If you do not set `OPENAI_API_KEY`, the UI will still run, but matches will be generated via a simple heuristic fallback (no LLM ranking).

### 2) Install dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3) Run backend
```bash
cd backend
npm run dev
```
Backend runs at `http://localhost:3001`.

### 4) Run frontend
In a second terminal:
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173`.

Optionally set a different API URL:
```bash
VITE_API_URL=http://localhost:3001
```

## How Matching Works (LLM-based Semantic Ranking)
1. `POST /match` receives:
   - `{"query":"user natural language requirement"}`
2. The backend loads `data/products.json`.
3. The backend sends the buyer query + product JSON to the LLM using the required system prompt (top 5 + scores + short explanations).
4. The backend parses the model output as JSON and enriches results with the full product specs.
5. The frontend renders the top 5 as cards with highlighted match scores and key specs.

## AI Tools Used
- OpenAI Chat Completions (LLM ranking + explainability)

## Assumptions
- No database is used; products are loaded from static JSON.
- Dataset is intentionally small (12–15 items) for speed and simplicity.
- LLM is used for semantic matching instead of embeddings for faster iteration in this prototype.

