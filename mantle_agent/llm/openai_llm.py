"""Real classifier over any OpenAI-compatible Chat Completions endpoint.

Works with OpenAI, Groq, OpenRouter, Together, local Ollama, etc.
Config via constructor args or environment variables:
    OPENAI_API_KEY   (required)
    OPENAI_BASE_URL  (optional, default https://api.openai.com/v1)
    OPENAI_MODEL     (optional, default gpt-4o-mini)

Uses only the Python standard library (urllib) — no SDK needed.
"""
from __future__ import annotations
import os
import json
import urllib.request

from ..models import NARRATIVES, NarrativeStat


class OpenAILLM:
    def __init__(self, api_key: str | None = None,
                 base_url: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.base_url = (base_url or os.environ.get("OPENAI_BASE_URL")
                         or "https://api.openai.com/v1").rstrip("/")
        self.model = model or os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

    def _chat(self, messages, max_tokens: int = 200, temperature: float = 0.2) -> str:
        payload = {"model": self.model, "messages": messages,
                   "temperature": temperature, "max_tokens": max_tokens}
        req = urllib.request.Request(
            self.base_url + "/chat/completions",
            data=json.dumps(payload).encode(),
            headers={"Authorization": f"Bearer {self.api_key}",
                     "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.loads(r.read())
        return body["choices"][0]["message"]["content"].strip()

    def classify(self, text: str) -> dict:
        sys = ("You are a crypto research classifier for the Mantle ecosystem. "
               "Classify the post into EXACTLY ONE narrative from this list: "
               + ", ".join(NARRATIVES) + ". "
               'Respond ONLY with compact JSON: '
               '{"narrative": <one from the list>, "sentiment": "bullish|neutral|bearish"}.')
        out = self._chat([{"role": "system", "content": sys},
                          {"role": "user", "content": text}], max_tokens=40)
        try:
            obj = json.loads(out[out.find("{"): out.rfind("}") + 1])
            n = obj.get("narrative", "Other")
            return {"narrative": n if n in NARRATIVES else "Other",
                    "sentiment": obj.get("sentiment", "neutral")}
        except Exception:
            return {"narrative": "Other", "sentiment": "neutral"}

    def synthesize(self, stats: list[NarrativeStat]) -> str:
        rows = "\n".join(
            f"- {s.name}: {s.mentions} mentions, {s.delta_pct:+.0f}% vs prior, "
            f"reach {s.reach/1e6:.2f}M, {s.breadth} sources, stage {s.stage}"
            for s in stats)
        sys = ("You are a crypto research analyst. In 2-3 sentences, tell a Mantle "
               "content creator which narrative to write about next and why, weighing "
               "momentum against reach. Be concrete and concise.")
        return self._chat([{"role": "system", "content": sys},
                           {"role": "user", "content": rows}], max_tokens=160)
