"""Render the two-lens research payload as a Markdown digest."""
from __future__ import annotations


class ReportSkill:
    def render(self, p: dict) -> str:
        m = p["market"]
        L = [
            "# Mantle Research Agent — Daily Digest",
            f"_Generated {p['generated_at']} · source: MockAdapter (sample data) · LLM: {p['llm']}_\n",
            "## 📈 Lens 1 — Market Monitor",
            f"Coverage: {m['coverage']} equities · Liquidity ${m['liquidity']/1e6:.1f}M · 24h vol ${m['volume']/1e6:.1f}M\n",
            "| Symbol | Onchain | Spread | Liquidity | 24h Vol | Signals |",
            "|---|---:|---:|---:|---:|---|",
        ]
        for r in m["rows"]:
            L.append(
                f"| {r['symbol']} | ${r['price']:,.2f} | {r['spread_bps']:.0f} bps | "
                f"${r['liquidity']/1e6:.1f}M | ${r['volume']/1e6:.2f}M | {'; '.join(r['signals'])} |"
            )
        L.append("\n## 📡 Lens 2 — Narrative Radar (7d)")
        L.append("| Narrative | Mentions | Δ vs prior | Reach | Sources | Stage |")
        L.append("|---|---:|---:|---:|---:|---|")
        for s in p["narratives"]:
            L.append(
                f"| {s['name']} | {s['mentions']} | {s['delta_pct']:+.0f}% | "
                f"{s['reach']/1e6:.2f}M | {s['breadth']} | {s['stage']} |"
            )
        L.append("\n## 🧠 Agent's take")
        L.append(p["take"])
        return "\n".join(L)
