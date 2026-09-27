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
- ✅ **Phase 3**: Card & Set Database (TCGdex integration, 102 Base Set cards ingested)
- ✅ **Phase 4**: Shop System (Buy booster packs, deduct coins, player unopened pack inventory, ledger transactions)
- ✅ **Phase 5**: Pack Opening Engine (PLAYABLE GAME! Server-side slot RNG, 3D card deck flip, permanent collection storage, XP & leveling)
- ✅ **Phase 6**: Collection / Binder (Master binder view, 9-pocket sheet simulation, advanced search, sorting, elemental type filters, card flip inspect modal)
- ✅ **Phase 7**: Inventory & Asset Management (Real-time unopened pack vault, card inventory, active status sync)
- ✅ **Phase 8**: Economy & Card Selling Engine (Individual card selling, 1-click automated duplicate liquidation at 70% rate preserving 1x master binder copies, immutable financial audit ledger)
- ✅ **Phase 9**: Missions / Daily Quests & Level Progression (Daily directives, weekly bounties, lifetime achievements, dynamic transaction sync, claimable rewards, level-up milestones)
- ✅ **Phase 10**: Marketplace & Player Trading Desk (Player card listings, secure card escrow engine, 5% protocol transaction fee, live order book, search & multi-filter, atomic buy/sell settlement, cancellation vault refund, sales & trade ledger audit)
- ✅ **Phase 11**: Events & Rotating Dynamic Content (7-day daily login streak calendar, live seasonal events with 2x XP and holo foil buffs, rotating daily flash deal vault, dedicated Events Hub)
- ✅ **Phase 12**: Trading System & Direct Peer-to-Peer Offers (Player search, 4-step create wizard, offer/request cards, atomic card swap on accept, 48h expiry, decline & cancel flows, Trading Hub with incoming/sent tabs)
- ✅ **Phase 13**: Leaderboards & Social Rankings (Global Hall of Fame rankings for Richest, Master Collectors, Grand Traders, Level & Prestige, Top 3 podiums, personal rank tracker, public profile with showcase vault, and player follow/unfollow system)
- ✅ **Phase 14**: Cosmetics, Sleeves & Binder Customization (Custom card sleeves, atmospheric binder themes, tournament playmats, glowing avatar frames, prestige titles, interactive dressing room stage with card flip preview, and collection/profile styling integration)
- ✅ **Phase 15**: Player Shops & Custom Storefronts (Personalized collector stalls in the Nexus Bazaar, custom banners and slogans, center stage card pedestal, shop visit tracking, community upvotes/likes, inventory stocking, and 1-click storefront buying)
- ⏳ **Phase 16**: Coming Soon


