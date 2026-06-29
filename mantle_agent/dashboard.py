"""Render the research payload as a standalone site entry page."""
from __future__ import annotations
import json
import html as _html


def _stage_class(stage: str) -> str:
    if "breaking" in stage:
        return "hot"
    if "emerging" in stage:
        return "up"
    if "cooling" in stage:
        return "down"
    return "mid"


def render_html(p: dict) -> str:
    m = p["market"]

    rows = ""
    for r in m["rows"]:
        spread_cls = "good" if r["spread_bps"] <= 50 else "bad"
        chips = "".join(
            f'<span class="chip {"good" if s.startswith("✅") else "warn"}">{_html.escape(s)}</span>'
            for s in r["signals"]
        )
        rows += (
            "<tr>"
            f'<td class="sym">{r["symbol"]}<span class="muted">{_html.escape(r["name"])}</span></td>'
            f'<td class="num">${r["price"]:,.2f}</td>'
            f'<td class="num"><span class="pill {spread_cls}">{r["spread_bps"]:.0f} bps</span></td>'
            f'<td class="num">${r["liquidity"]/1e6:.1f}M</td>'
            f'<td class="num">${r["volume"]/1e6:.2f}M</td>'
            f"<td>{chips}</td>"
            "</tr>"
        )

    max_abs = max((abs(s["delta_pct"]) for s in p["narratives"]), default=1) or 1
    narr = ""
    for s in p["narratives"]:
        cls = _stage_class(s["stage"])
        width = abs(s["delta_pct"]) / max_abs * 100
        sign = "pos" if s["delta_pct"] >= 0 else "neg"
        narr += (
            '<div class="narr">'
            f'<div class="narr-top"><span class="narr-name">{_html.escape(s["name"])}</span>'
            f'<span class="badge {cls}">{_html.escape(s["stage"])}</span></div>'
            f'<div class="bar"><div class="bar-fill {sign}" style="width:{width:.0f}%"></div>'
            f'<span class="delta {sign}">{s["delta_pct"]:+.0f}%</span></div>'
            f'<div class="narr-meta">{s["mentions"]} mentions · {s["reach"]/1e6:.2f}M reach · {s["breadth"]} sources</div>'
            "</div>"
        )

    top = p["narratives"][0]["name"] if p["narratives"] else "—"
    most_liquid = max(m["rows"], key=lambda row: row["liquidity"])
    widest = max(m["rows"], key=lambda row: row["spread_bps"])
    data_json = json.dumps(p).replace("</", "<\\/")

    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Mantle Research Agent</title>'
        '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">'
        '<link rel="stylesheet" href="/assets/styles.css">'
        '</head><body><div class="wrap">'
        '<div class="header"><div class="brand"><div class="logo">M</div>'
        '<div><h1>Mantle Research Agent</h1>'
        '<div class="sub">One agent, two lenses · Market Monitor + Narrative Radar</div></div></div>'
        f'<div class="meta">Generated {p["generated_at"]}<br>'
        f'<span class="tag">LLM: {p["llm"]}</span> <span class="tag">MockAdapter</span></div></div>'
        '<div class="layout"><main class="panel-stack">'
        '<div class="stats">'
        f'<div class="stat"><div class="k">Coverage</div><div class="v">{m["coverage"]} <small>equities</small></div></div>'
        f'<div class="stat"><div class="k">Liquidity</div><div class="v">${m["liquidity"]/1e6:.1f}<small>M</small></div></div>'
        f'<div class="stat"><div class="k">24h Volume</div><div class="v">${m["volume"]/1e6:.1f}<small>M</small></div></div>'
        f'<div class="stat"><div class="k">Top narrative</div><div class="v" style="font-size:16px;line-height:1.3">{_html.escape(top)}</div></div>'
        '</div>'
        '<div class="tabs" role="tablist" aria-label="Research lenses">'
        '<button class="tab-btn active" type="button" role="tab" aria-selected="true" data-tab-target="lens1"><strong>Lens 1</strong><span>Market Monitor</span></button>'
        '<button class="tab-btn" type="button" role="tab" aria-selected="false" data-tab-target="lens2"><strong>Lens 2</strong><span>Narrative Radar</span></button>'
        '</div>'
        '<section class="tab-panel active" data-tab-panel="lens1">'
        '<div class="section"><h2>Lens 1 - Market Monitor</h2>'
        '<span class="hint">tokenized equities · liquidity · spread · signals</span></div>'
        '<div class="card"><table><thead><tr><th>Symbol</th><th class="num">Onchain</th>'
        '<th class="num">Spread</th><th class="num">Liquidity</th><th class="num">24h Vol</th>'
        f'<th>Signals</th></tr></thead><tbody>{rows}</tbody></table></div>'
        '<div class="card pad" style="margin-top:14px">'
        '<div class="section"><h2>Lens 1 snapshot</h2><span class="hint">plain-language market health</span></div>'
        '<div class="mini-grid">'
        f'<div class="mini-card"><div class="k">Most liquid</div><div class="v">{most_liquid["symbol"]}</div><div class="sub">${most_liquid["liquidity"]/1e6:.1f}M available depth</div></div>'
        f'<div class="mini-card"><div class="k">Watch spread</div><div class="v">{widest["symbol"]}</div><div class="sub">{widest["spread_bps"]:.0f} bps spread</div></div>'
        '</div></div></section>'
        '<section class="tab-panel" data-tab-panel="lens2">'
        '<div class="section"><h2>Lens 2 - Narrative Radar</h2>'
        '<span class="hint">7-day momentum vs prior period</span></div>'
        f'<div class="narr-grid">{narr}</div>'
        f'<div class="take"><div class="lbl">Agent\'s take</div><p>{_html.escape(p["take"])}</p></div>'
        '</section></main>'
        '<aside class="agent-shell">'
        '<div class="agent-card">'
        '<div class="agent-head"><h2>Work with the agent</h2><p>Ask in plain language. The agent can explain Lens 1, Lens 2, compare assets, or summarize what matters now.</p></div>'
        '<div class="quick-actions">'
        '<button class="quick-btn" type="button" data-prompt="What should I pay attention to right now?">Priority summary</button>'
        '<button class="quick-btn" type="button" data-prompt="Which asset has the strongest liquidity?">Top liquidity</button>'
        '<button class="quick-btn" type="button" data-prompt="What is the hottest narrative right now?">Top narrative</button>'
        '<button class="quick-btn" type="button" data-prompt="Tell me about Tesla.">Tesla</button>'
        '<button class="quick-btn" type="button" data-prompt="Compare Lens 1 and Lens 2 for me.">Compare lenses</button>'
        '</div>'
        '<div class="messages" id="agent-messages" aria-live="polite"></div>'
        '<form class="composer" id="agent-form">'
        '<label class="hidden" for="agent-input">Ask the agent</label>'
        '<textarea id="agent-input" placeholder="Example: Which market looks healthiest, and which narrative should I follow next?"></textarea>'
        '<div class="composer-bar"><div class="composer-hint">Designed for non-technical users. Ask in everyday language.</div><button class="primary-btn" id="agent-submit" type="submit">Ask agent</button></div>'
        '</form>'
        '<div class="status" id="agent-status">Server-connected mode is available when you run the site with --serve.</div>'
        '</div>'
        '<div class="card pad"><div class="section"><h2>Session actions</h2><span class="hint">browser tools</span></div><button class="quick-btn" id="refresh-dashboard" type="button">Check latest payload</button></div>'
        '</aside></div>'
        '<div class="foot">Mantle Research Agent · built for the Mantle Research Challenge · figures are illustrative sample data</div>'
        '</div>'
        f'<script id="payload" type="application/json">{data_json}</script>'
        '<script src="/assets/app.js"></script>'
        '</body></html>'
    )
