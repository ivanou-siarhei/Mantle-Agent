"""The LLM interface used by the Narrative Radar.

Any implementation must provide:
  - classify(text)  -> {"narrative": str, "sentiment": str}
  - synthesize(stats) -> str   (the human-readable "Agent's take")
"""
from __future__ import annotations
from typing import Protocol

from ..models import NarrativeStat


class LLMClassifier(Protocol):
    def classify(self, text: str) -> dict: ...
    def synthesize(self, stats: list[NarrativeStat]) -> str: ...
