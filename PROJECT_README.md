# Mantle Tokenized Equities Intelligence Agent — Project Archive

Version: 1.0
Archive created: 2026-06-25

## Contents

This archive contains the full source code of the Mantle Tokenized Equities Intelligence Agent platform.

### Structure
```
mantle-intel-project.tar.gz
├── src/                      # Next.js 16 + React 19 + TypeScript frontend
│   ├── app/                  # App router pages + API routes
│   │   ├── api/              # 9 API endpoints (overview, assets, pools, ask, etc.)
│   │   ├── layout.tsx        # Root layout with ThemeProvider
│   │   ├── page.tsx          # Main dashboard (Overview/Assets/Pools/AI Insights)
│   │   └── globals.css       # Tailwind + dark mode variables
│   ├── components/           # UI components
│   │   ├── ui/               # shadcn/ui component library
│   │   ├── dashboard/        # StatCard, HealthBadge, InsightCard, OpportunityList
│   │   ├── charts/           # Recharts visualizations (donut, bars, history)
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── intel/            # Business logic (TypeScript port of Python backend)
│   │   │   ├── models.ts     # Pydantic-equivalent types
│   │   │   ├── synthetic.ts  # Deterministic data adapter
│   │   │   ├── analytics.ts  # TVL, APR, Health Scores (0-100)
│   │   │   ├── opportunities.ts  # Best Yield / Hidden Gems / Risk detection
│   │   │   ├── narrator.ts   # Rule-based AI insights (Daily Brief, Ask Mantle)
│   │   │   ├── storage.ts    # Prisma + SQLite persistence
│   │   │   ├── refresh.ts    # Discovery → analytics → opportunities pipeline
│   │   │   └── cache.ts      # In-memory cache
│   │   ├── backend.ts        # API client for the frontend
│   │   ├── format.ts         # USD/percent/date formatters
│   │   ├── db.ts             # Prisma client
│   │   └── utils.ts          # cn() helper
│   └── hooks/                # use-toast, use-mobile
├── backend/                  # Original Python FastAPI reference implementation
│   ├── adapters/             # xStocks / Fluxion / RFQ discovery
│   ├── analytics/            # Health scoring (Python)
│   ├── opportunities/        # Opportunity engine (Python)
│   ├── ai/                   # Narrator + LLM augmenter (Python)
│   ├── storage/              # SQLite layer (Python)
│   ├── api/                  # FastAPI routes
│   ├── models/               # Pydantic models
│   ├── tests/                # Smoke tests
│   └── main.py               # FastAPI entrypoint
├── prisma/
│   └── schema.prisma         # SQLite schema (snapshots, asset/pool series, trades, etc.)
├── scripts/
│   ├── llm_rewrite.mjs       # LLM subprocess for Ask Mantle augmentation
│   ├── run_backend.sh        # Backend auto-restart supervisor
│   └── start_backend.sh      # Backend launcher
├── public/                   # Static assets (logo, robots.txt)
├── package.json              # Dependencies (Next.js 16, React 19, Prisma, recharts, etc.)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json           # shadcn/ui config
├── Caddyfile                 # Gateway config (for sandbox deployment)
├── LLM_SETTINGS.md           # How to connect LLM to Ask Mantle
└── .env                      # DATABASE_URL for Prisma
```

## Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Python 3.12+ (optional — only for the reference Python backend)

### Install & Run (Next.js dashboard)

```bash
# 1. Extract archive
tar xzf mantle-intel-project.tar.gz
cd mantle-intel-project

# 2. Install dependencies
bun install
# or: npm install

# 3. Set up the database
echo 'DATABASE_URL="file:./db/custom.db"' > .env
bun run db:push
# or: npx prisma db push

# 4. Start the dev server
bun run dev
# or: npm run dev

# 5. Open http://localhost:3000
```

### Optional: Run the Python backend (reference implementation)

```bash
cd backend
pip install -r requirements.txt  # fastapi, uvicorn, pydantic, httpx
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Python backend API available at http://localhost:8000/docs
```

## Features

- **4 dashboard tabs**: Overview, Assets, Pools, AI Insights
- **9 API endpoints**: health, refresh, overview, assets, pools, opportunities, insights (daily-brief/health/opportunities), ask, snapshots
- **Analytics engine**: TVL, Volume, Fees, APR, Liquidity/Growth/Health scores (0-100) — all computed in TypeScript
- **Opportunity detection**: Best Yield, Hidden Gems, Liquidity, Risk flags
- **Ask Mantle**: Natural-language Q&A grounded in calculated metrics (rule-based by default; LLM augmentation optional — see LLM_SETTINGS.md)
- **Historical analysis**: SQLite persistence of snapshots, asset/pool time series, trades, AI summaries
- **Dark/Light/Auto theme**: next-themes with full component adaptation
- **Responsive design**: mobile, tablet, desktop

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (New York), recharts, lucide-react, next-themes
- **Backend**: Next.js API routes (TypeScript) with Prisma ORM
- **Database**: SQLite (via Prisma)
- **Reference backend**: Python 3.12, FastAPI, Pydantic, httpx (in `backend/`)

## Documentation

- `LLM_SETTINGS.md` — How to connect an LLM to the Ask Mantle feature (z-ai-web-dev-sdk, OpenAI, Anthropic, Ollama examples)

## License

MIT — see source files for details.

---

## Update — Narrative Radar + real LLM (this fork)

This fork brings the dashboard in line with the original "one agent, two lenses"
concept and wires the LLM that was previously only documented:

### Added — Lens 2: Narrative Radar
- `src/lib/intel/narrative.ts` — classifies ecosystem chatter into narratives
  (AI agents / x402, Tokenized equities, RFQ / deep liquidity, Restaking / mETH, Other),
  computes momentum (Δ vs prior period), reach and breadth, and tags each as
  🔥 breaking out / 🚀 emerging / 📊 mainstream / 📉 cooling. All numbers are
  computed in code — the LLM only rewrites the take.
- `src/lib/intel/digest.ts` — single two-lens Markdown research digest
  (Market Monitor + Narrative Radar + Agent's take), copy-pasteable to X / Notion.
- New posts source in `synthetic.ts` (`discoverPosts`), wired into the refresh pipeline.
- New API routes: `GET /api/narratives`, `GET /api/digest`.
- New **Narratives** tab in the dashboard (radar table + Markdown digest with Copy).

### Added — pluggable LLM (OpenAILLM / MockLLM)
- `src/lib/intel/llm.ts` — OpenAI-compatible Chat Completions client (no SDK, plain `fetch`).
  Offline-first: with no key set it is a no-op (MockLLM). It only rewrites tone or
  picks a label from a fixed list, and a number guardrail rejects any rewrite that
  introduces new numbers. Wired into `ask`, `daily-brief`, `health`, `opportunities`
  and the Narrative Radar take.
- Going live is just env vars — no code change:
  ```bash
  export OPENAI_API_KEY=sk-...                          # enables the LLM
  export OPENAI_BASE_URL=https://api.groq.com/openai/v1 # optional, any compatible endpoint
  export OPENAI_MODEL=llama-3.1-8b-instant             # optional
  ```
  Free options: Groq (Llama 3.1 8B) or OpenRouter free-tier models.

### Fixed / cleaned
- `.env` `DATABASE_URL` now uses a portable relative path (`file:./db/custom.db`)
  instead of a hardcoded machine path.
- Removed the dead duplicate Python `backend/` and its run scripts — the frontend
  talks only to the Next.js API routes.
- Pruned unused dependencies from `package.json` (dnd-kit, mdxeditor, next-auth,
  next-intl, react-query, framer-motion, zustand, z-ai-web-dev-sdk).
