# Mantle Research Agent

> One autonomous research agent, two lenses — built for the [Mantle Research Challenge](https://x.com/Mantle_Official).

The agent watches the Mantle ecosystem on two fronts and turns raw data into a single, publishable **research digest** — in your terminal, as Markdown, or as a slick **browser dashboard**:

- **📈 Lens 1 — Market Monitor:** tokenized-equity price, liquidity, spread, and premium/discount signals (SPCXx, TSLAx, NVDAx, AAPLx, …) across Fluxion, Merchant Moe and Bybit.
- **📡 Lens 2 — Narrative Radar:** an LLM classifies ecosystem chatter into narratives (AI agents/x402, tokenized equities, RFQ liquidity, restaking…) and ranks them by momentum — surfacing what's *breaking out* before it goes mainstream.

It maps onto Mantle's AI Agent stack: modular **Skills**, **ERC-8004** identity (stub), and **x402** payments (stub) for paid data endpoints.

## Quickstart

```bash
git clone <your-repo-url>
cd mantle-research-agent
python3 main.py            # prints the digest and writes digest.md
```

No dependencies, no API key required — it ships with sample data and a deterministic `MockLLM`, so it runs end-to-end offline.

## Browser dashboard (UI)

Generate a beautiful, self-contained dashboard you can open in any browser:

```bash
python3 main.py --html     # writes dashboard.html (open it by double-click)
python3 main.py --serve    # writes it AND serves at http://localhost:8000
```

The dashboard inlines all of its data and styling — **no build step, no dependencies, no external CDN** — so it opens offline. It renders the two lenses as stat cards, a market table with color-coded spread/signal badges, and narrative cards with momentum bars and stage badges (🔥 breaking out / 🌱 emerging / 📊 mainstream / 📉 cooling).

## Plugging in a real LLM (OpenAI-compatible)

The agent auto-detects an API key and switches from `MockLLM` to `OpenAILLM` — no code change. Works with OpenAI, **Groq**, **OpenRouter**, Together, local Ollama, etc.

```bash
export OPENAI_API_KEY=sk-...                          # your (free) key
export OPENAI_BASE_URL=https://api.groq.com/openai/v1 # optional — any compatible endpoint
export OPENAI_MODEL=llama-3.1-8b-instant             # optional
python3 main.py --html
```

`OpenAILLM` does two jobs: `classify()` tags each post into a narrative (strict JSON), and `synthesize()` writes the "Agent's take."

## Project structure

```
mantle-research-agent/
├── main.py                  # entry point + build_llm() + --html / --serve
├── requirements.txt
├── README.md
└── mantle_agent/
    ├── __init__.py
    ├── models.py            # EquitySnapshot, Post, NarrativeStat, NARRATIVES
    ├── agent.py             # MantleResearchAgent (orchestration + payload)
    ├── dashboard.py         # render_html(payload) — self-contained browser UI
    ├── adapters/
    │   ├── base.py          # DataAdapter protocol
    │   └── mock.py          # MockAdapter (swap for LiveAdapter)
    ├── llm/
    │   ├── base.py          # LLMClassifier protocol
    │   ├── mock.py          # MockLLM (offline fallback)
    │   └── openai_llm.py    # OpenAILLM (OpenAI-compatible)
    └── skills/
        ├── analysis.py      # AnalysisSkill (Market Monitor)
        ├── narrative.py     # NarrativeSkill (Narrative Radar)
        └── report.py        # ReportSkill (Markdown digest)
```

The agent's `payload()` is the single source of truth — both the Markdown digest and the browser dashboard render from it, so they never drift apart.

## From demo to production

1. **Write `LiveAdapter`** (same interface as `MockAdapter`): Fluxion subgraph + RWA.xyz + CoinGecko/Bybit + X API/RSS/Discord.
2. **Add reference oracles** for assets with a public underlying (TSLA, NVDA, AAPL) to make premium/discount real.
3. **Schedule it** (cron or on-chain event trigger) and auto-post the digest to X / Notion / Discord.
4. **Register ERC-8004 identity** + wire **x402** for paid data endpoints (or pay-per-inference).

## License

MIT — see [LICENSE](./LICENSE).
