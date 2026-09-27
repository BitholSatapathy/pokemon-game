# Database Architecture

This directory holds SQL migrations, schema definitions, and seed data for TCG Collector.

- **ORM**: SQLAlchemy
- **Supported Engines**:
  - Development / Local default: SQLite (`sqlite:///./tcg.db`)
  - Production / Staging: PostgreSQL (`postgresql://user:pass@host:5432/tcg_collector`)
- **Config**: Configured via `DATABASE_URL` in `.env` or `backend/app/core/config.py`.
