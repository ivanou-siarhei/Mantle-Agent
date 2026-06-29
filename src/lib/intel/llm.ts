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
 *   OPENAI_API_KEY          (required to enable the LLM)
 *   OPENAI_BASE_URL         (default https://api.openai.com/v1 — any compatible endpoint)
 *   OPENAI_MODEL            (default gpt-4o-mini)
 *   OPENAI_REASONING_EFFORT (optional: low|medium|high — for reasoning models
 *                            like Groq openai/gpt-oss-120b; keeps the answer from
 *                            being eaten by the reasoning token budget)
 *
 * Example (Groq + gpt-oss-120b):
 *   OPENAI_API_KEY=gsk_...
 *   OPENAI_BASE_URL=https://api.groq.com/openai/v1
 *   OPENAI_MODEL=openai/gpt-oss-120b
 *   OPENAI_REASONING_EFFORT=low
 */

import type { AIInsight } from "./models";

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  reasoningEffort?: string;
}

export function llmConfig(): LlmConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    reasoningEffort: process.env.OPENAI_REASONING_EFFORT?.trim() || undefined,
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
    const payload: Record<string, unknown> = {
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 400,
    };
    // Reasoning models (e.g. Groq openai/gpt-oss-120b) spend completion tokens
    // on hidden reasoning. A low effort keeps the visible answer from being
    // truncated; the param is ignored by non-reasoning models.
    if (cfg.reasoningEffort) payload.reasoning_effort = cfg.reasoningEffort;
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
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

// ---------------------------------------------------------------------------
// Free-form, data-grounded Q&A ("Ask Mantle")
// ---------------------------------------------------------------------------

const ASK_SYSTEM =
  "You are the Mantle Research Agent, an analyst for the Mantle tokenized-equities " +
  "ecosystem. Answer the user's question using ONLY the data in the CONTEXT block. " +
  "STRICT RULES: never invent or estimate numbers, prices, tickers or facts that are " +
  "not in the context; every figure you cite must appear in the context; if the context " +
  "lacks the data needed, say so plainly. Be concise (under 110 words), specific, and " +
  "reference concrete figures from the context. Return plain text only.";

function canonNumberSet(s: string): Set<string> {
  const set = new Set<string>();
  for (const raw of s.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    const v = parseFloat(raw.replace(/,/g, ""));
    if (Number.isFinite(v)) set.add(String(v));
  }
  return set;
}

// Grounding guardrail: police only decimal figures (prices, %, $M/$K — the
// dangerous, precise-looking numbers). Bare integers (counts, days, scores)
// are allowed through. Returns true if the answer cites a decimal number
// that is not present in the context.
function fabricatesNumbers(context: string, answer: string): boolean {
  const ctx = canonNumberSet(context);
  for (const raw of answer.match(/\d+\.\d+/g) ?? []) {
    if (!ctx.has(String(parseFloat(raw)))) return true;
  }
  return false;
}

/**
 * Free-form, data-grounded answer. Returns an LLM answer constrained to the
 * provided context, or null when the LLM is unavailable or the answer fails
 * the grounding guardrail (caller then falls back to the deterministic
 * rule-based answer).
 */
export async function answerWithContext(
  question: string,
  context: string
): Promise<string | null> {
  if (!llmAvailable()) return null;
  const out = await chat(ASK_SYSTEM, `CONTEXT:\n${context}\n\nQUESTION: ${question}`, {
    temperature: 0.3,
    // Generous budget so reasoning models still have room for the visible answer.
    maxTokens: 1200,
  });
  if (!out) return null;
  if (fabricatesNumbers(context, out)) return null; // never invent numbers
  return out;
}
