"""Core data models shared across skills, adapters and the LLM layer."""
from __future__ import annotations
from dataclasses import dataclass, field

# Canonical narrative taxonomy the Narrative Radar classifies posts into.
NARRATIVES = [
    "AI agents / x402",
    "Tokenized equities",
    "RFQ / deep liquidity",
    "Restaking / mETH",
    "Other",
]


@dataclass
class EquitySnapshot:
    """A point-in-time market snapshot for one tokenized equity."""
    symbol: str
    name: str
    onchain_price: float
    reference_price: float | None
    liquidity_usd: float
    volume_24h_usd: float
    bid: float
    ask: float
    venues: list[str] = field(default_factory=list)

    @property
    def spread_bps(self) -> float:
        mid = (self.bid + self.ask) / 2
        return (self.ask - self.bid) / mid * 10_000 if mid else float("nan")

    @property
    def premium_pct(self) -> float | None:
        if not self.reference_price:
            return None
        return (self.onchain_price - self.reference_price) / self.reference_price * 100


@dataclass
class Post:
    """A single piece of ecosystem chatter (X post, blog, Discord message...)."""
    source: str
    text: str
    reach: int
    is_official: bool = False


@dataclass
class NarrativeStat:
    """Aggregated momentum for one narrative over the lookback window."""
    name: str
    mentions: int
    delta_pct: float
    reach: int
    breadth: int

    @property
    def stage(self) -> str:
        if self.delta_pct >= 150 and self.breadth >= 3:
            return "🔥 breaking out"
        if self.delta_pct >= 60:
            return "🌱 emerging"
        if self.delta_pct <= -10:
            return "📉 cooling"
        return "📊 mainstream"
