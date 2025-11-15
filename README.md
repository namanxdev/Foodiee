## 🍳 Foodiee – Your AI Sous Chef (by Oldowan Innovations)

Foodiee is an end-to-end culinary copilot that listens to your cravings, combs through curated cookbooks, and walks you through every sizzling step—complete with AI-crafted visuals and chef-approved alternates. It marries a FastAPI brain with a dazzling Next.js dashboard so you can plan, cook, and wow with confidence. 

---

### ✨ Why Foodiee Rocks
- 🧠 **Taste-aware intelligence**: Gemini-powered reasoning fuses your preferences, pantry, and dietary flags into three spot-on recommendations.
- 📚 **Hybrid RAG magic**: FAISS-embedded PDFs, optimized SQLite caches, and LangChain orchestration keep answers fast, accurate, and context-rich.
- 🍽️ **Guided cooking flow**: Session-aware API tracks progress, serves ingredient breakdowns, and keeps you calm from prep to plating.
- 🖼️ **Visual flair on demand**: GPU-ready Stable Diffusion pipeline (with text fallback) generates picture-perfect dishes and step imagery.
- 🛠️ **Admin superpowers**: Manage recipes, throttle image usage, regenerate content, and surface top performers through dedicated routes.
- 💫 **Front-of-house polish**: Next.js 15 + Tailwind + DaisyUI deliver responsive gradients, animated progress, and delightful micro-interactions.

---

### 🏗️ System Architecture
```
                        🌐 Foodiee Dashboard (Next.js)
                                   │
                                   ▼
🧾 REST APIs ──▶ 🍲 FastAPI Backend (backend_recipe)
                    │
                    ├─ 🧠 LangChain + Gemini (dialogue + reasoning)
                    ├─ 📂 FAISS index (Pdfs/ cookbook embeddings)
                    ├─ 🗄️ SQLite & Supabase schemas (database/, data/)
                    └─ 🎨 Image engine (core/image_generator.py + workers/)
```

---

### 🗂️ Project Atlas
```
Oldowan Innovations/
├── backend_recipe/                 # Foodiee API, AI pipelines, data tooling
│   ├── api/                        # Routers: preferences, recipes, users, admin, images
│   ├── core/                       # Recommenders, RAG flows, visual prompt engines
│   ├── database/                   # SQLite helpers + migration scripts
│   ├── models/                     # Pydantic shapes for every payload
│   ├── workers/                    # Batch generation, monitoring, progress tracking
│   ├── prompts/                    # LangChain prompt templates
│   ├── generate_top_recipies/      # Leaderboard refresh automation
│   ├── data/, Dataset/, data/top_recipes/  # Seed CSVs & shipped DBs
│   ├── main.py                     # FastAPI entry point
│   ├── requirements.txt            # Python dependencies
│   └── docs (*.md)                 # Integration, API, localhost testing guides
├── dashboard_recipe/               # Foodiee dashboard (Next.js 15, React 19, Tailwind 4)
│   ├── src/app/                    # App Router pages (landing, chat, history, admin, etc.)
│   ├── src/components/             # PreferencesForm, RecipeList, CookingSteps, modals, UI kit
│   ├── src/services/               # API clients (preferences, recipes, images, admin)
│   ├── src/contexts/               # Theme + vegetarian toggles
│   ├── src/utils/                  # Formatting, validation, helpers
│   └── IMPLEMENTATION_SUMMARY.md   # Deep-dive of shipped frontend features
├── Pdfs/                           # (Optional) cookbook PDFs for RAG ingestion
├── venv/                           # Local Python virtual environment (if created)
└── README.md                       # This living document
```

---

### 🔐 Environment Checklist
- 🐍 Python 3.10+  
- 🟢 Node.js 18+ (or latest LTS)  
- 🔑 `GOOGLE_API_KEY` (Gemini access) in `.env`  
- 🧪 Optional: `HF_TOKEN` for HuggingFace-hosted diffusion models  
- 🎮 Optional: NVIDIA GPU + CUDA drivers for real-time image generation  

---

### 🚀 Quickstart (Backend + Frontend)

**Backend • FastAPI (`backend_recipe`)**
1. `cd backend_recipe`
2. (Optional) `python -m venv venv && venv\Scripts\activate` (Windows) or `source venv/bin/activate` (macOS/Linux)
3. `pip install -r requirements.txt`
4. `copy .env.example .env` (if available) and populate:
   - `GOOGLE_API_KEY=...`
   - `HF_TOKEN=...` *(optional)*
   - `API_HOST`, `API_PORT`, `PDF_DIRECTORY`, `FAISS_INDEX_PATH` *(optional overrides)*
5. Drop PDF cookbooks into `Pdfs/` for richer retrieval (optional)
6. Fire it up: `python main.py` *(or `uvicorn main:app --reload --port 8000`)*

> 📜 Swagger: `http://localhost:8000/docs`  
> 📚 ReDoc: `http://localhost:8000/redoc`  
> 🧭 Health: `GET http://localhost:8000/`

**Frontend • Next.js Dashboard (`dashboard_recipe`)**
1. `cd dashboard_recipe`
2. `npm install`
3. (Optional) create `.env.local` → `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
4. `npm run dev`, then launch `http://localhost:3000`
5. Submit preferences, pick a recipe, cook along, and watch AI visuals appear! 🍲

---

### 🔄 Core User Journey
1. **Discover** – Submit cuisine, taste, diet, time, dislikes, and pantry items. Foodiee returns three on-point dishes.  
2. **Decide** – Inspect each card’s summary and choose your hero recipe.  
3. **Prep** – Dive into ingredients, cooking tips, and step previews.  
4. **Cook** – Advance through timed steps, request alternatives, and generate images per instruction.  
5. **Delight** – Celebrate completion, explore top recipes, or restart the flow with fresh cravings.  

---

### 🛠️ Background Automations & Data
- 🥇 `generate_top_recipies/generate_top_recipies.py`: rebuilds curated top-recipe rankings.  
- 📈 `workers/monitoring.py` + `workers/progress_tracker.py`: track image jobs and batch workloads.  
- 🧾 `database/*.sql`, `supabase_*_setup.sql`: schema blueprints for local SQLite or hosted Supabase.  
- 📂 `data/` & `Dataset/`: bundled CSVs for cuisines, ingredients, and seed recipes.  

---

### ✅ Test Drive & QA
- 🧪 Unit/API validation: `backend_recipe/test_top_recipes_api.py`  
- 🌀 Swagger scripts: follow `backend_recipe/API_DOCUMENTATION.md` for request/response samples.  
- 🖥️ Manual flow:
  - Start backend (`python main.py`)
  - Start frontend (`npm run dev`)
  - Run from Preferences → Recommendations → Details → Cooking Steps  
  - Trigger image generation both with and without GPU support.  
- 🔄 Troubleshooting? Check `backend_recipe/LOCALHOST_TESTING_CHANGES.md` and console logs for RAG/indexing status.  

---

### ☁️ Deployment Playbook
- 🐳 **Backend container**: package FastAPI, mount `Pdfs/`, persist FAISS index. Targets: Railway, Render, Cloud Run, Azure Container Apps.  
- ⚡ **Frontend hosting**: deploy static build via Vercel, Netlify, or containerized Next.js. Configure `NEXT_PUBLIC_API_BASE_URL` with HTTPS endpoint.  
- 🔒 **Production hardening**: enable HTTPS + CORS, externalize session storage (Redis/Postgres), schedule top-recipe refresh, enforce image rate limits.  

---

### 📚 Reference Library
- `backend_recipe/INTEGRATION_GUIDE.md` – deep wiring guide for services/components.  
- `backend_recipe/API_DOCUMENTATION.md` – endpoint-by-endpoint contract.  
- `dashboard_recipe/FRONTEND_README.md` – Next.js commands, build tips, deployment.  
- `dashboard_recipe/IMPLEMENTATION_SUMMARY.md` – visual + UX breakdown of shipped UI.  
- `Problem Statement.md` – original Foodiee mission brief.  

---

Fueled by Oldowan Innovations, Foodiee keeps evolving—refresh this README whenever new routes, flows, or deployment strategies land. Until then, sharpen those knives and let the AI sous chef do the prep! 👩‍🍳✨
