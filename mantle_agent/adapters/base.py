"""Data source interface. Swap MockAdapter for a LiveAdapter without touching analysis."""
from __future__ import annotations
from typing import Protocol

from ..models import EquitySnapshot, Post


class DataAdapter(Protocol):
    def fetch_equities(self) -> list[EquitySnapshot]: ...
    def fetch_posts(self) -> list[Post]: ...
    def prior_narrative_counts(self) -> dict[str, int]: ...
