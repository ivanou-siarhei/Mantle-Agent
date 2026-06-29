/**
 * Pluggable LLM client — OpenAI-compatible Chat Completions.
 *
 * Offline-first: when no API key is set, every function is a no-op that
 * returns the deterministic input unchanged. This is the "OpenAILLM /
 * MockLLM" auto-switch from the agent concept, implemented in code.
 *
 * Guardrail: the model may only REWRITE tone or pick a label from a
 * fixed list. It must never introduce new numbers — enforced below.
 *
 * Going live is just environment variables (no code change):
 *   OPENAI_API_KEY   (required to enable the LLM)
 *   OPENAI_BASE_URL  (default https://api.openai.com/v1 — any compatible endpoint)
 *   OPENAI_MODEL     (default gpt-4o-mini)
 */

import type { AIInsight } from "./models";

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function llmConfig(): LlmConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export function llmAvailable(): boolean {
  return llmConfig() !== null;
}

export function llmLabel(): string {
  const cfg = llmConfig();
  return cfg ? `OpenAILLM (${cfg.model})` : "MockLLM (offline)";
}

async function chat(
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  const cfg = llmConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 400,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

// --- number guardrail -------------------------------------------------------

function numberSet(s: string): Set<string> {
  const m = s.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return new Set(m.map((x) => x.replace(/,/g, "")));
}

function introducesNewNumbers(original: string, rewritten: string): boolean {
  const orig = numberSet(original);
  for (const n of numberSet(rewritten)) {
    if (!orig.has(n)) return true;
  }
  return false;
}

const REWRITE_SYSTEM =
  "You are a crypto market analyst editor. Rewrite the given research note so it reads " +
  "naturally and concisely for a professional audience. STRICT RULES: do not add, remove, " +
  "or change any numbers, percentages, tickers or facts; do not invent data; only improve " +
  "clarity, flow and tone. Keep it under 90 words. Return plain text only.";

/** Rewrite tone only. Falls back to the input on any failure or guardrail trip. */
export async function llmRewrite(text: string): Promise<string> {
  if (!text.trim() || !llmAvailable()) return text;
  const out = await chat(REWRITE_SYSTEM, text, { temperature: 0.4, maxTokens: 300 });
  if (!out) return text;
  if (introducesNewNumbers(text, out)) return text; // reject hallucinated numbers
  return out;
}

/** Rewrite an insight's body for tone, preserving all numbers/evidence. */
export async function rewriteInsight(insight: AIInsight): Promise<AIInsight> {
  if (!llmAvailable()) return insight;
  const body = await llmRewrite(insight.body);
  return body === insight.body ? insight : { ...insight, body };
}

/** Classify text into exactly one of the provided narrative labels. */
export async function classifyNarrative(text: string, labels: string[]): Promise<string | null> {
  if (!llmAvailable()) return null;
  const system =
    `You are a classifier. Assign the text to exactly ONE of these narrative labels: ` +
    `${labels.join(" | ")}. Reply with ONLY the exact label string, nothing else.`;
  const out = await chat(system, text, { temperature: 0, maxTokens: 20 });
  if (!out) return null;
  const norm = out.trim().toLowerCase();
  return (
    labels.find((l) => l.toLowerCase() === norm) ??
    labels.find((l) => norm.includes(l.toLowerCase())) ??
    null
  );
}
