#!/usr/bin/env python3
"""Entry point for the Mantle Research Agent.

Usage:
    python3 main.py            # print + write the Markdown digest (digest.md)
    python3 main.py --html     # write the site entry page (index.html)
    python3 main.py --serve    # write the site and serve it at http://localhost:8000

With a real LLM (any OpenAI-compatible endpoint):
    export OPENAI_API_KEY=sk-...
    export OPENAI_BASE_URL=https://api.groq.com/openai/v1   # optional
    export OPENAI_MODEL=llama-3.1-8b-instant                # optional
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path

from mantle_agent import MantleResearchAgent
from mantle_agent.adapters import MockAdapter
from mantle_agent.llm import MockLLM, OpenAILLM, LLMClassifier
from mantle_agent.dashboard import render_html

SITE_ENTRY = "index.html"
LEGACY_DASHBOARD = "dashboard.html"
ASSETS_DIR = Path("assets")


def build_llm() -> LLMClassifier:
    """Use the real LLM when a key is present; otherwise fall back to MockLLM."""
    if os.environ.get("OPENAI_API_KEY"):
        try:
            llm = OpenAILLM()
            print(f"[info] using OpenAILLM → {llm.model} @ {llm.base_url}")
            return llm
        except Exception as e:  # noqa: BLE001
            print(f"[warn] OpenAILLM init failed ({e}); falling back to MockLLM")
    else:
        print("[info] no OPENAI_API_KEY — using MockLLM (offline demo)")
    return MockLLM()


def _write_site(payload: dict) -> None:
    ASSETS_DIR.mkdir(exist_ok=True)
    with open(SITE_ENTRY, "w", encoding="utf-8") as f:
        f.write(render_html(payload))
    legacy = Path(LEGACY_DASHBOARD)
    if legacy.exists():
        legacy.unlink()
        print(f"[info] removed legacy {LEGACY_DASHBOARD}")
    print(f"[info] wrote {SITE_ENTRY}")


def _serve(agent: MantleResearchAgent, path: str = SITE_ENTRY, port: int = 8000) -> None:
    import http.server
    import socketserver
    import webbrowser

    class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True
        daemon_threads = True

    class DashboardRequestHandler(http.server.SimpleHTTPRequestHandler):
        def _send_json(self, payload: dict, status: int = 200) -> None:
            encoded = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/api/payload":
                self._send_json(agent.payload())
                return
            if self.path in ("/", ""):
                self.path = f"/{path}"
            super().do_GET()

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/api/chat":
                self.send_error(404, "Not Found")
                return

            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
                data = json.loads(raw_body.decode("utf-8")) if raw_body else {}
                question = str(data.get("question", ""))
                response = agent.answer_question(question)
                self._send_json({"ok": True, **response})
            except Exception as exc:  # noqa: BLE001
                self._send_json(
                    {
                        "ok": False,
                        "error": "The agent could not process that request.",
                        "details": str(exc),
                    },
                    status=500,
                )

    url = f"http://localhost:{port}/"
    print(f"[info] serving {url}  (Ctrl+C to stop)")
    try:
        webbrowser.open(url)
    except Exception:  # noqa: BLE001
        pass
    with ThreadedTCPServer(("", port), DashboardRequestHandler) as httpd:
        httpd.serve_forever()


def main(argv: list[str] | None = None) -> None:
    argv = sys.argv[1:] if argv is None else argv
    agent = MantleResearchAgent(MockAdapter(), build_llm())

    if "--html" in argv or "--serve" in argv:
        _write_site(agent.payload())
        if "--serve" in argv:
            _serve(agent)
        return

    report = agent.run()
    with open("digest.md", "w") as f:
        f.write(report)
    print(report)


if __name__ == "__main__":
    main()
