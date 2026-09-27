# 🎴 TCG Collector — 27-Phase Roadmap

This project adheres to a strict "vibe coding" philosophy: small, self-contained phases where each phase produces a working, testable milestone before moving forward.

## 📌 Milestones Checkpoints

- **M0 — Foundation** (Phase 0) — Project structure, React + FastAPI running, `/api/health` communicating.
- **M1 — UI / Design System** (Phase 1) — Theme, design tokens, reusable components, all page routes with mock data.
- **M2 — Account** (Phase 2) — User registration, login, JWT auth, player stats (10,000 starting coins, Level 1).
- **M3 — Cards** (Phase 3) — Ingest 1 initial set with cards, rarities, and artwork into DB.
- **M4 — Shop** (Phase 4) — Purchase booster packs using player coins.
- **M5 — Pack Opening (PLAYABLE GAME)** (Phase 5) — Server-side RNG, flip cards, add cards to collection.
- **M6 — Collection Binder** (Phase 6) — Set completion stats, search, rarity filters, detail modal.
- **M7 — Inventory & Economy** (Phases 7 & 8) — Separate collection vs inventory, sell duplicate cards, transaction logs.
- **M8 — Progression** (Phases 9 & 10) — XP, player levels, daily missions, achievements.
- **M9 — Marketplace** (Phases 11, 12, 13) — Player card listings, unopened pack listings, dynamic pricing.
- **M10 — Live Game** (Phases 14, 15, 16, 17, 18, 19) — Events, cosmetics, trading, friends, leaderboards, player shops.
- **M11 — AI & Production** (Phases 20-27) — AI assistant, anti-cheat, admin panel, mobile PWA, deployment.

---

## 🎨 Design System Guide (Phase 1)

- **Background**: `#0B0B12` (Obsidian Dark)
- **Panels/Cards**: `#131322` with backdrop blur and border `#221C3E`
- **Primary Violet**: `#8B5CF6` / `#7C3AED`
- **Accent Gold**: `#F59E0B` / `#FBBF24`
- **Rarity Colors**:
  - Common: `#94A3B8` (Slate)
  - Uncommon: `#10B981` (Emerald)
  - Rare: `#3B82F6` (Sapphire)
  - Ultra Rare: `#A855F7` (Amethyst)
  - Secret Rare: `#F59E0B` / Holographic Gold
