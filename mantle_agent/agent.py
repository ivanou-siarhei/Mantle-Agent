"""Top-level orchestration: wires adapters, skills and the LLM into one run."""
from __future__ import annotations
import datetime as dt
import math

from .adapters.base import DataAdapter
from .llm.base import LLMClassifier
from .skills.analysis import AnalysisSkill
from .skills.narrative import NarrativeSkill
from .skills.report import ReportSkill


class MantleResearchAgent:
    """One agent, two lenses.

    Lens 1: Market Monitor  — tokenized-equity price/liquidity/spread signals.
    Lens 2: Narrative Radar — which ecosystem narratives are accelerating.
    """

    def __init__(self, adapter: DataAdapter, llm: LLMClassifier):
        self.adapter = adapter
        self.llm = llm
        self.analyzer = AnalysisSkill()
        self.narrative = NarrativeSkill(llm)
        self.reporter = ReportSkill()
        # ERC-8004 identity (stub) lets the agent build a verifiable track record.
        self.erc8004_id = "agent://erc8004/0xRESEARCHER...(stub)"

    def payload(self) -> dict:
        """Run both lenses and return a structured result.

        This single source of truth feeds both the Markdown digest and the
        browser dashboard, so they never drift apart.
        """
        equities = self.adapter.fetch_equities()              # x402-paid in prod
        radar = self.narrative.radar(
            self.adapter.fetch_posts(),
            self.adapter.prior_narrative_counts(),
        )
        return {
            "generated_at": dt.datetime.now(dt.UTC).strftime("%Y-%m-%d %H:%M UTC"),
            "llm": type(self.llm).__name__,
            "market": {
                "coverage": len(equities),
                "liquidity": sum(e.liquidity_usd for e in equities),
                "volume": sum(e.volume_24h_usd for e in equities),
                "rows": [
                    {
                        "symbol": e.symbol,
                        "name": e.name,
                        "price": e.onchain_price,
                        "spread_bps": e.spread_bps,
                        "liquidity": e.liquidity_usd,
                        "volume": e.volume_24h_usd,
                        "premium_pct": e.premium_pct,
                        "signals": self.analyzer.signals(e),
                    }
                    for e in sorted(equities, key=lambda x: -x.liquidity_usd)
                ],
            },
            "narratives": [
                {
                    "name": s.name,
                    "mentions": s.mentions,
                    "delta_pct": s.delta_pct,
                    "reach": s.reach,
                    "breadth": s.breadth,
                    "stage": s.stage,
                }
                for s in radar
            ],
            "take": self.llm.synthesize(radar),
        }

    def answer_question(self, question: str) -> dict:
        """Return a user-friendly answer for the browser chat UI."""
        prompt = (question or "").strip()
        payload = self.payload()

        if not prompt:
            return {
                "answer": "Ask about market health, liquidity, spreads, or which narrative is gaining momentum.",
                "highlights": [
                    "Try: Which asset is the most liquid?",
                    "Try: What is the hottest narrative right now?",
                    "Try: Summarize Lens 1 and Lens 2 for me.",
                ],
                "lens": "overview",
                "source": payload,
            }

        market_rows = payload["market"]["rows"]
        narratives = payload["narratives"]
        lower_prompt = prompt.lower()

        matched_equity = next(
            (
                row for row in market_rows
                if row["symbol"].lower() in lower_prompt or row["name"].lower() in lower_prompt
            ),
            None,
        )
        matched_narrative = next(
            (item for item in narratives if item["name"].lower() in lower_prompt),
            None,
        )

        if matched_equity is not None:
            spread_state = "tight" if matched_equity["spread_bps"] <= 50 else "wide"
            premium = matched_equity["premium_pct"]
            premium_text = "No offchain reference price available."
            if premium is not None and not math.isnan(premium):
                premium_text = f"Premium vs reference: {premium:+.2f}%."
            return {
                "answer": (
                    f"{matched_equity['name']} ({matched_equity['symbol']}) is trading at "
                    f"${matched_equity['price']:,.2f} with {spread_state} spread conditions "
                    f"({matched_equity['spread_bps']:.0f} bps). Liquidity is ${matched_equity['liquidity']/1e6:.1f}M "
                    f"and 24h volume is ${matched_equity['volume']/1e6:.2f}M. {premium_text}"
                ),
                "highlights": matched_equity["signals"],
                "lens": "lens1",
                "source": matched_equity,
            }

        if matched_narrative is not None:
            return {
                "answer": (
                    f"{matched_narrative['name']} is currently {matched_narrative['stage'].replace('🔥 ', '').replace('🌱 ', '').replace('📉 ', '').replace('📊 ', '')}. "
                    f"It has {matched_narrative['mentions']} mentions, {matched_narrative['delta_pct']:+.0f}% momentum versus the prior window, "
                    f"{matched_narrative['reach']/1e6:.2f}M reach, and {matched_narrative['breadth']} contributing sources."
                ),
                "highlights": [
                    f"Momentum: {matched_narrative['delta_pct']:+.0f}%",
                    f"Reach: {matched_narrative['reach']/1e6:.2f}M",
                    f"Breadth: {matched_narrative['breadth']} sources",
                ],
                "lens": "lens2",
                "source": matched_narrative,
            }

        if any(word in lower_prompt for word in ("narrative", "lens 2", "radar", "momentum", "theme")):
            top = max(narratives, key=lambda item: item["delta_pct"])
            return {
                "answer": (
                    f"Lens 2 shows {top['name']} as the fastest-moving narrative at {top['delta_pct']:+.0f}% versus the prior period. "
                    f"It combines momentum with {top['reach']/1e6:.2f}M reach, while the current agent take is: {payload['take']}"
                ),
                "highlights": [
                    f"Top narrative: {top['name']}",
                    f"Stage: {top['stage']}",
                    f"Mentions: {top['mentions']}",
                ],
                "lens": "lens2",
                "source": top,
            }

        if any(word in lower_prompt for word in ("market", "lens 1", "spread", "liquidity", "volume", "equit")):
            most_liquid = max(market_rows, key=lambda row: row["liquidity"])
            widest = max(market_rows, key=lambda row: row["spread_bps"])
            return {
                "answer": (
                    f"Lens 1 currently covers {payload['market']['coverage']} equities with ${payload['market']['liquidity']/1e6:.1f}M total liquidity "
                    f"and ${payload['market']['volume']/1e6:.1f}M in 24h volume. {most_liquid['symbol']} is the deepest market, while {widest['symbol']} has the widest spread."
                ),
                "highlights": [
                    f"Most liquid: {most_liquid['symbol']} (${most_liquid['liquidity']/1e6:.1f}M)",
                    f"Widest spread: {widest['symbol']} ({widest['spread_bps']:.0f} bps)",
                    f"24h volume: ${payload['market']['volume']/1e6:.1f}M",
                ],
                "lens": "lens1",
                "source": payload["market"],
            }

        summary = self.run()
        return {
            "answer": (
                "Here is the current cross-lens summary: "
                f"{payload['take']}"
            ),
            "highlights": [
                f"Coverage: {payload['market']['coverage']} equities",
                f"Top narrative: {narratives[0]['name'] if narratives else '—'}",
                f"Digest length: {len(summary.splitlines())} lines",
            ],
            "lens": "overview",
            "source": payload,
        }

    def run(self) -> str:
        """Return the Markdown research digest."""
        return self.reporter.render(self.payload())
