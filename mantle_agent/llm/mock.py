"""Deterministic, offline, zero-dependency classifier so the demo always runs."""
from __future__ import annotations

from ..models import NarrativeStat


class MockLLM:
    THEMES = {
        "agent": "AI agents / x402", "x402": "AI agents / x402",
        "spcx": "Tokenized equities", "stock": "Tokenized equities",
        "equit": "Tokenized equities", "rfq": "RFQ / deep liquidity",
        "liquidit": "RFQ / deep liquidity", "restak": "Restaking / mETH",
        "meth": "Restaking / mETH",
    }

    def classify(self, text: str) -> dict:
        t = text.lower()
        theme = next((v for k, v in self.THEMES.items() if k in t), "Other")
        sentiment = "bullish" if any(w in t for w in ("live", "grew", "largest", "launch")) else "neutral"
        return {"narrative": theme, "sentiment": sentiment}

    def synthesize(self, stats: list[NarrativeStat]) -> str:
        hot = max(stats, key=lambda s: s.delta_pct)
        big = max(stats, key=lambda s: s.reach)
        return (
            f'"{hot.name}" is the fastest-accelerating narrative (+{hot.delta_pct:.0f}% w/w) '
            f'and still under-covered vs its speed — prime window to publish before it goes '
            f'mainstream like "{big.name}". Cooling themes are lower-priority for new content.'
        )
