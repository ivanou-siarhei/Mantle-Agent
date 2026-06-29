"""Lens 2 — Narrative Radar: classify chatter, then rank narratives by momentum."""
from __future__ import annotations

from ..models import Post, NarrativeStat
from ..llm.base import LLMClassifier


class NarrativeSkill:
    def __init__(self, llm: LLMClassifier):
        self.llm = llm

    def radar(self, posts: list[Post], prior_counts: dict[str, int]) -> list[NarrativeStat]:
        agg: dict[str, dict] = {}
        for p in posts:
            n = self.llm.classify(p.text)["narrative"]
            d = agg.setdefault(n, {"mentions": 0, "reach": 0, "sources": set()})
            d["mentions"] += 1
            d["reach"] += p.reach
            d["sources"].add(p.source)
        stats: list[NarrativeStat] = []
        for name, d in agg.items():
            prior = prior_counts.get(name, max(1, d["mentions"] // 2))
            delta = (d["mentions"] - prior) / prior * 100
            stats.append(NarrativeStat(name, d["mentions"], delta, d["reach"], len(d["sources"])))
        return sorted(stats, key=lambda s: -s.delta_pct)
