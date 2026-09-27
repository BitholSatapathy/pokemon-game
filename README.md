# 🎴 TCG Collector

A modern, high-polish Trading Card Game (TCG) simulator and collection web application built with **React + TypeScript + Tailwind CSS** on the frontend and **FastAPI + SQLAlchemy** on the backend.

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: 3.10+ (tested on 3.14)

---

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   Backend will run at: `http://localhost:8000`  
   API Documentation (Swagger UI): `http://localhost:8000/docs`  
   Health Check: `http://localhost:8000/api/health`

---

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Frontend will run at: `http://localhost:5173`

---

## 📁 Project Structure

```
pokemon-game/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # UI design system & layout components
│   │   │   ├── common/           # HealthIndicator, EmptyState, etc.
│   │   │   ├── layout/           # Navbar, Sidebar, CurrencyBar, Footer
│   │   │   └── ui/               # Button, Card, Modal, Tabs, Toast, Badge, etc.
│   │   ├── context/              # Toast & application context
│   │   ├── data/                 # Prototype mock data for cards, packs, listings
│   │   ├── pages/                # Route pages (/dashboard, /shop, /packs, etc.)
│   │   ├── types/                # Core TypeScript interfaces
│   │   ├── App.tsx               # Main routing & application layout
│   │   └── index.css             # Tailwind design tokens & dark gaming glassmorphism
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/                  # API routers & endpoints (v1)
│   │   ├── core/                 # App configuration & SQLAlchemy database engine
│   │   ├── models/               # SQLAlchemy ORM models
│   │   └── main.py               # FastAPI entrypoint with CORS
│   ├── requirements.txt
│   └── .env.example
├── database/                     # Migrations & schema definitions
│   └── README.md
├── docs/                         # Roadmap & architecture documentation
│   └── ROADMAP.md
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap & Milestones

See [docs/ROADMAP.md](docs/ROADMAP.md) for the complete 27-phase vibe-coding progression.
- ✅ **Phase 0**: Project Foundation (React + Vite + Tailwind + FastAPI + Health Check)
- ✅ **Phase 1**: UI & Design System (Dark gaming aesthetic, reusable components, interactive routing)
- ✅ **Phase 2**: Authentication & Player Account (Registration, JWT, Starting Coins: 10,000, Level 1)
- ⏳ **Phase 3**: Card & Set Database (TCGdex integration, single set ingestion)
- ⏳ **Phase 4**: Shop System (Buy Booster Packs)
- ⏳ **Phase 5**: Pack Opening Engine (Server-side RNG, 3D/flip card reveal)
