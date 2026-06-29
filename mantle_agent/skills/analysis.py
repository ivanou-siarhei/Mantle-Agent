"""Lens 1 — Market Monitor: turn a raw snapshot into market-health signals."""
from __future__ import annotations

from ..models import EquitySnapshot


class AnalysisSkill:
    LOW_LIQ = 3_000_000     # USD
    WIDE_SPREAD = 50        # bps
    PREMIUM_FLAG = 1.0      # percent

    def signals(self, e: EquitySnapshot) -> list[str]:
        out: list[str] = []
        if e.liquidity_usd < self.LOW_LIQ:
            out.append(f"⚠️ thin liquidity (${e.liquidity_usd/1e6:.1f}M)")
        if e.spread_bps > self.WIDE_SPREAD:
            out.append(f"⚠️ wide spread ({e.spread_bps:.0f} bps)")
        p = e.premium_pct
        if p is not None and abs(p) >= self.PREMIUM_FLAG:
            out.append(f"🔍 {abs(p):.2f}% {'premium' if p > 0 else 'discount'} vs reference")
        return out or ["✅ healthy: tight spread, adequate depth"]
