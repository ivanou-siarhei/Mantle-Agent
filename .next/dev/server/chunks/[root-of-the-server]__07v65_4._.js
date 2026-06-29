module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/intel/llm.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

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
 */ __turbopack_context__.s([
    "answerWithContext",
    ()=>answerWithContext,
    "classifyNarrative",
    ()=>classifyNarrative,
    "llmAvailable",
    ()=>llmAvailable,
    "llmConfig",
    ()=>llmConfig,
    "llmLabel",
    ()=>llmLabel,
    "llmRewrite",
    ()=>llmRewrite,
    "rewriteInsight",
    ()=>rewriteInsight
]);
function llmConfig() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    return {
        apiKey,
        baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        reasoningEffort: process.env.OPENAI_REASONING_EFFORT?.trim() || undefined
    };
}
function llmAvailable() {
    return llmConfig() !== null;
}
function llmLabel() {
    const cfg = llmConfig();
    return cfg ? `OpenAILLM (${cfg.model})` : "MockLLM (offline)";
}
async function chat(system, user, opts = {}) {
    const cfg = llmConfig();
    if (!cfg) return null;
    try {
        const payload = {
            model: cfg.model,
            messages: [
                {
                    role: "system",
                    content: system
                },
                {
                    role: "user",
                    content: user
                }
            ],
            temperature: opts.temperature ?? 0.4,
            max_tokens: opts.maxTokens ?? 400
        };
        // Reasoning models (e.g. Groq openai/gpt-oss-120b) spend completion tokens
        // on hidden reasoning. A low effort keeps the visible answer from being
        // truncated; the param is ignored by non-reasoning models.
        if (cfg.reasoningEffort) payload.reasoning_effort = cfg.reasoningEffort;
        const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cfg.apiKey}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30_000)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        return typeof text === "string" ? text.trim() : null;
    } catch  {
        return null;
    }
}
// --- number guardrail -------------------------------------------------------
function numberSet(s) {
    const m = s.match(/\d+(?:[.,]\d+)?/g) ?? [];
    return new Set(m.map((x)=>x.replace(/,/g, "")));
}
function introducesNewNumbers(original, rewritten) {
    const orig = numberSet(original);
    for (const n of numberSet(rewritten)){
        if (!orig.has(n)) return true;
    }
    return false;
}
const REWRITE_SYSTEM = "You are a crypto market analyst editor. Rewrite the given research note so it reads " + "naturally and concisely for a professional audience. STRICT RULES: do not add, remove, " + "or change any numbers, percentages, tickers or facts; do not invent data; only improve " + "clarity, flow and tone. Keep it under 90 words. Return plain text only.";
async function llmRewrite(text) {
    if (!text.trim() || !llmAvailable()) return text;
    const out = await chat(REWRITE_SYSTEM, text, {
        temperature: 0.4,
        maxTokens: 300
    });
    if (!out) return text;
    if (introducesNewNumbers(text, out)) return text; // reject hallucinated numbers
    return out;
}
async function rewriteInsight(insight) {
    if (!llmAvailable()) return insight;
    const body = await llmRewrite(insight.body);
    return body === insight.body ? insight : {
        ...insight,
        body
    };
}
async function classifyNarrative(text, labels) {
    if (!llmAvailable()) return null;
    const system = `You are a classifier. Assign the text to exactly ONE of these narrative labels: ` + `${labels.join(" | ")}. Reply with ONLY the exact label string, nothing else.`;
    const out = await chat(system, text, {
        temperature: 0,
        maxTokens: 20
    });
    if (!out) return null;
    const norm = out.trim().toLowerCase();
    return labels.find((l)=>l.toLowerCase() === norm) ?? labels.find((l)=>norm.includes(l.toLowerCase())) ?? null;
}
// ---------------------------------------------------------------------------
// Free-form, data-grounded Q&A ("Ask Mantle")
// ---------------------------------------------------------------------------
const ASK_SYSTEM = "You are the Mantle Research Agent, an analyst for the Mantle tokenized-equities " + "ecosystem. Answer the user's question using ONLY the data in the CONTEXT block. " + "STRICT RULES: never invent or estimate numbers, prices, tickers or facts that are " + "not in the context; every figure you cite must appear in the context; if the context " + "lacks the data needed, say so plainly. Be concise (under 110 words), specific, and " + "reference concrete figures from the context. Return plain text only.";
function canonNumberSet(s) {
    const set = new Set();
    for (const raw of s.match(/\d+(?:[.,]\d+)?/g) ?? []){
        const v = parseFloat(raw.replace(/,/g, ""));
        if (Number.isFinite(v)) set.add(String(v));
    }
    return set;
}
// Grounding guardrail: police only decimal figures (prices, %, $M/$K — the
// dangerous, precise-looking numbers). Bare integers (counts, days, scores)
// are allowed through. Returns true if the answer cites a decimal number
// that is not present in the context.
function fabricatesNumbers(context, answer) {
    const ctx = canonNumberSet(context);
    for (const raw of answer.match(/\d+\.\d+/g) ?? []){
        if (!ctx.has(String(parseFloat(raw)))) return true;
    }
    return false;
}
async function answerWithContext(question, context) {
    if (!llmAvailable()) return null;
    const out = await chat(ASK_SYSTEM, `CONTEXT:\n${context}\n\nQUESTION: ${question}`, {
        temperature: 0.3,
        // Generous budget so reasoning models still have room for the visible answer.
        maxTokens: 1200
    });
    if (!out) return null;
    if (fabricatesNumbers(context, out)) return null; // never invent numbers
    return out;
}
}),
"[project]/src/app/api/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/llm.ts [app-route] (ecmascript)");
;
;
const dynamic = "force-dynamic";
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        status: "ok",
        ts: new Date().toISOString(),
        llmAvailable: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["llmAvailable"])(),
        llmLabel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["llmLabel"])()
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__07v65_4._.js.map