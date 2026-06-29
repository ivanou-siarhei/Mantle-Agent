"""Sample data so the agent runs end-to-end offline.

In production, implement a LiveAdapter with the same interface that pulls from:
  - Fluxion subgraph (pool reserves, swaps)
  - RWA.xyz (TVL), CoinGecko / Bybit (reference prices)
  - X API / RSS / Discord webhooks (posts)
"""
from __future__ import annotations

from ..models import EquitySnapshot, Post


class MockAdapter:
    def fetch_equities(self) -> list[EquitySnapshot]:
        return [
            EquitySnapshot("SPCXx", "SpaceX", 204.11, None, 8_900_000, 3_200_000, 203.40, 204.82, ["Fluxion", "Merchant Moe"]),
            EquitySnapshot("TSLAx", "Tesla", 348.92, 349.10, 5_400_000, 1_750_000, 348.40, 349.44, ["Fluxion"]),
            EquitySnapshot("NVDAx", "NVIDIA", 173.55, 173.20, 4_100_000, 2_050_000, 173.10, 174.00, ["Fluxion"]),
            EquitySnapshot("AAPLx", "Apple", 241.30, 241.95, 2_300_000, 540_000, 240.55, 242.05, ["Fluxion"]),
        ]

    def fetch_posts(self) -> list[Post]:
        return [
            Post("@Mantle_Official", "SPCXx live on Mantle via Fluxion & Merchant Moe — largest IPO in history", 1_200_000, True),
            Post("@Fluxion_network", "xChange Atomic RFQ enables issuer-direct mint/redeem, deep liquidity", 240_000, True),
            Post("@QuestFlow", "Build autonomous AI agents on Mantle with x402 payments & ERC-8004", 180_000),
            Post("@kol_defi", "the x402 AI agent meta on Mantle is heating up, agents paying agents", 420_000),
            Post("@kol_alpha", "watching the AI agent + x402 stack on Mantle, early", 310_000),
            Post("@analyst_x", "another tokenized equity (NVDAx) seeing volume on Fluxion", 95_000),
            Post("@mantle_dev", "AI agents using x402 to pay for data — this is the agent economy", 60_000),
            Post("@stake_guy", "mETH restaking yields compressing a bit this week", 70_000),
        ]

    def prior_narrative_counts(self) -> dict[str, int]:
        return {
            "AI agents / x402": 1,
            "Tokenized equities": 3,
            "RFQ / deep liquidity": 1,
            "Restaking / mETH": 2,
        }
