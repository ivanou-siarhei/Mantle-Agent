# LLM Settings — Mantle Tokenized Equities Intelligence Agent

Это руководство описывает, как подключить LLM (Language Model) к платформе, чтобы пользователь мог общаться с AI-ассистентом в секции **Ask Mantle** на вкладке AI Insights.

---

## 1. Как сейчас работает Ask Mantle

По умолчанию платформа использует **детерминированный rule-based генератор ответов** (`src/lib/intel/narrator.ts`). Это означает:

- **Преимущества**: ответы всегда основаны на вычисленных метриках (Principle 4 — Data First), нет галлюцинаций, работает без сети и API-ключей.
- **Недостатки**: ответы шаблонные, неестественные, без возможностей reasoning.

Чтобы ответы звучали естественно и могли рассуждать о данных, можно подключить LLM через `z-ai-web-dev-sdk` (уже установлен в проекте).

---

## 2. Архитектура LLM-интеграции

```
Пользователь задаёт вопрос
        ↓
   POST /api/ask
        ↓
┌─────────────────────────────────┐
│  answerQuestion() [narrator.ts] │  ← всегда вызывается первым
│  Генерирует rule-based ответ     │     (это ground truth — метрики)
│  + bullets + evidence            │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│  llmRewrite() [llm.ts]          │  ← опционально, если useLlm=true
│  Переписывает narrative для     │     НЕ добавляет новые факты!
│  лучшего тона, сохраняя метрики │
└─────────────────────────────────┘
        ↓
   Insight → пользователю + в SQLite
```

**Ключевой принцип**: LLM **только переписывает** уже сгенерированный ответ для лучшего тона. Она **не имеет права** добавлять новые числа, факты или выводы — это guardrail против галлюцинаций. Все числа приходят из вычисленных метрик аналитического слоя.

---

## 3. Включение LLM — быстрая инструкция

### Шаг 1. Создание LLM-обёртки

Файл `src/lib/intel/llm.ts` (нужно создать) — пример реализации:

```typescript
import ZAI from "z-ai-web-dev-sdk";
import type { AIInsight } from "./models";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Переписывает narrative insight для более естественного тона.
 * Сохраняет все числа и bullets — LLM получает их как ground truth.
 *
 * Если SDK недоступен или вызов упал, возвращает исходный insight без изменений.
 */
export async function llmRewrite(insight: AIInsight): Promise<AIInsight> {
  try {
    const zai = await getZai();
    const system = [
      "You are an analyst for the Mantle tokenized equities intelligence platform.",
      "Rewrite the user-supplied narrative in clear, professional English.",
      "Do NOT introduce new numbers or facts — only rephrase what is given.",
      "Keep the original bullet points unchanged.",
      "Output a single paragraph (3-5 sentences).",
    ].join(" ");

    const userPrompt = [
      `Title: ${insight.title}`,
      `Bullets:`,
      ...insight.bullets.map((b) => `- ${b}`),
      ``,
      `Original narrative:`,
      insight.body,
      ``,
      `Rewrite the narrative paragraph only. Do not change bullets.`,
    ].join("\n");

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const rewritten =
      completion?.choices?.[0]?.message?.content ??
      completion?.message?.content ??
      "";

    if (rewritten.trim().length > 20) {
      return { ...insight, body: rewritten.trim() };
    }
    return insight;
  } catch (e) {
    console.warn("[llm] rewrite failed, returning deterministic narrative:", e);
    return insight;
  }
}
```

### Шаг 2. Подключение в API route

В файле `src/app/api/ask/route.ts` добавить опциональный параметр `useLlm`:

```typescript
import { llmRewrite } from "@/lib/intel/llm";

export async function POST(request: Request) {
  // ... existing code ...
  const useLlm = Boolean(body?.useLlm);

  let insight = answerQuestion(question, cache.snapshot!, cache.assets, cache.pools, cache.opportunities);

  if (useLlm) {
    insight = await llmRewrite(insight);  // ← LLM augment
  }

  await writeAiSummary(insight);
  return NextResponse.json(insight);
}
```

### Шаг 3. Активация на фронтенде

В `src/lib/backend.ts`:

```typescript
ask(question: string, useLlm = false) {
  return getJson<AIInsight>("/api/ask", {
    method: "POST",
    body: JSON.stringify({ question, use_llm: useLlm }),
  });
}
```

И в `src/app/page.tsx` — добавить тумблер "Enhanced mode" рядом с полем ввода Ask Mantle, который будет передавать `useLlm: true`.

---

## 4. Настройки LLM

Все параметры LLM настраиваются в функции `llmRewrite()` через объект `zai.chat.completions.create({...})`:

| Параметр | По умолчанию | Описание |
|---|---|---|
| `temperature` | `0.4` | 0.0 = максимально точный, 1.0 = креативный. Для финансовых инсайтов держите 0.3–0.5. |
| `max_tokens` | `600` | Максимальная длина ответа. Увеличьте до 1000 для длинных briefings. |
| `model` | (по умолчанию SDK) | Можно указать явно: `model: "glm-4.6"` |
| `system` prompt | (см. код выше) | Инструкция для LLM — что она может и не может делать. |
| `top_p` | (по умолчанию) | Nucleus sampling — альтернатива temperature. |

### Рекомендуемый system prompt

```
You are an analyst for the Mantle tokenized equities intelligence platform.
Your job: rewrite the provided narrative in clear, professional English.

STRICT RULES:
- Do NOT introduce new numbers, metrics, or facts.
- Do NOT invent asset symbols, pool addresses, or APR values.
- Only rephrase what is given in the original narrative.
- Keep all bullet points unchanged.
- Output a single cohesive paragraph (3-5 sentences).
- Use a confident but measured tone — this is financial analysis.
```

---

## 5. Переменные окружения

`z-ai-web-dev-sdk` не требует API-ключа при запуске в песочнице Z.ai. Для production-деплоя создайте файл `.env.local`:

```bash
# .env.local
ZAI_API_KEY=your_api_key_here          # если используется внешний endpoint
ZAI_BASE_URL=https://api.z.ai/v1       # опционально, для кастомного endpoint
LLM_ENABLED=true                        # глобальный флаг включения LLM
LLM_MODEL=glm-4.6                       # модель по умолчанию
LLM_TEMPERATURE=0.4                     # температура
LLM_MAX_TOKENS=600                      # лимит токенов
```

Чтобы использовать эти переменные в `llm.ts`:

```typescript
const useLlm = process.env.LLM_ENABLED === "true";
const model = process.env.LLM_MODEL ?? "glm-4.6";
const temperature = Number(process.env.LLM_TEMPERATURE ?? "0.4");
const maxTokens = Number(process.env.LLM_MAX_TOKENS ?? "600");
```

---

## 6. Тестирование LLM

### Быстрая проверка через curl

```bash
# Без LLM (детерминированный ответ)
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Where is liquidity moving?", "use_llm": false}'

# С LLM (переписанный ответ)
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Where is liquidity moving?", "use_llm": true}'
```

### Проверка через Node-скрипт

Файл `scripts/llm_rewrite.mjs` уже существует и может быть использован для тестов:

```bash
echo '{"prompt": "Test prompt", "system": "You are helpful."}' | node scripts/llm_rewrite.mjs
```

---

## 7. Альтернативные LLM-провайдеры

Если нужно использовать не `z-ai-web-dev-sdk`, а другую LLM (OpenAI, Anthropic, локальную Ollama), замените тело функции `llmRewrite()`:

### Пример: OpenAI

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function llmRewrite(insight: AIInsight): Promise<AIInsight> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(insight) },
    ],
    temperature: 0.4,
    max_tokens: 600,
  });
  const text = completion.choices[0]?.message?.content ?? "";
  return text ? { ...insight, body: text } : insight;
}
```

### Пример: Anthropic Claude

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function llmRewrite(insight: AIInsight): Promise<AIInsight> {
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(insight) }],
  });
  const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  return text ? { ...insight, body: text } : insight;
}
```

### Пример: локальная Ollama

```typescript
export async function llmRewrite(insight: AIInsight): Promise<AIInsight> {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(insight) },
      ],
      options: { temperature: 0.4 },
    }),
  });
  const data = await res.json();
  const text = data?.message?.content ?? "";
  return text ? { ...insight, body: text } : insight;
}
```

---

## 8. Контроль качества (Guardrails)

Чтобы убедиться, что LLM не галлюцинирует:

1. **Передавайте evidence**: в `insight.evidence` лежат все числа. После LLM-переписывания можно проверить, что все числа из evidence присутствуют в новом тексте.

2. **Schema validation**: можно добавить проверку, что LLM не добавила новые числа. Пример:

```typescript
function extractNumbers(text: string): Set<string> {
  return new Set(text.match(/\$?[\d,]+\.?\d*/g) ?? []);
}

function validateRewrite(original: AIInsight, rewritten: string): boolean {
  const originalNums = extractNumbers(original.body);
  const newNums = extractNumbers(rewritten);
  // Все числа из оригинала должны быть в переписанном
  for (const n of originalNums) {
    if (!newNums.has(n)) return false;
  }
  // В переписанном не должно быть новых чисел
  for (const n of newNums) {
    if (!originalNums.has(n)) return false;
  }
  return true;
}
```

3. **Fallback**: если validation не прошла, вернуть детерминированный ответ (как сейчас).

---

## 9. Стоимость и лимиты

При использовании `z-ai-web-dev-sdk` в песочнице Z.ai:
- Лимиты запросов определяются песочницей, обычно ~100 req/min.
- Каждый вызов Ask Mantle = 1 LLM-запрос (~600 токенов output).
- При 60s auto-refresh + LLM на всех insight'ах: ~5 запросов/мин = 300/час.

Для production с большим трафиком рекомендуется:
- Кэшировать ответы на одинаковые вопросы (Redis или in-memory LRU).
- Использовать `useLlm: true` только по явному клику пользователя (не на auto-refresh).
- Batch-режим для daily brief — генерировать раз в час, не при каждом запросе.

---

## 10. Устранение неполадок

| Симптом | Причина | Решение |
|---|---|---|
| `Error: ZAI.create is not a function` | SDK не установлен | `bun add z-ai-web-dev-sdk` |
| Ответы совпадают с rule-based | `useLlm: false` или LLM упала | Проверить логи сервера, убедиться что `useLlm: true` |
| LLM добавила новые числа | Слабый system prompt | Усилить prompt (см. раздел 4) |
| `502 Bad Gateway` при Ask | Бэкенд упал во время LLM-вызова | LLM-вызов синхронный — увеличьте timeout или сделайте async |
| `429 Too Many Requests` | Превышен rate limit | Уменьшите частоту запросов, добавьте кэш |

---

## 11. Файлы, связанные с LLM

| Файл | Назначение |
|---|---|
| `src/lib/intel/narrator.ts` | Rule-based генератор ответов (всегда вызывается) |
| `src/lib/intel/llm.ts` | (создать) LLM-обёртка над z-ai-web-dev-sdk |
| `src/app/api/ask/route.ts` | API endpoint для Ask Mantle |
| `src/app/api/insights/daily-brief/route.ts` | Daily Brief (тоже может использовать LLM) |
| `src/app/api/insights/health/route.ts` | Ecosystem Health (тоже может использовать LLM) |
| `src/app/api/insights/opportunities/route.ts` | Opportunity Summary (тоже может использовать LLM) |
| `scripts/llm_rewrite.mjs` | Standalone Node-скрипт для тестов LLM |
| `.env.local` | Переменные окружения (API-ключи, настройки) |

---

## 12. Чек-лист подключения LLM

- [ ] Создан `src/lib/intel/llm.ts` с функцией `llmRewrite()`
- [ ] В `src/app/api/ask/route.ts` добавлен параметр `useLlm`
- [ ] В `src/lib/backend.ts` метод `ask()` принимает `useLlm`
- [ ] В `src/app/page.tsx` добавлен тумблер "Enhanced mode" (опционально)
- [ ] System prompt запрещает добавление новых чисел
- [ ] При падении LLM возвращается детерминированный ответ (fallback)
- [ ] Тест: `curl -X POST /api/ask -d '{"question":"test","use_llm":true}'` возвращает переписанный ответ
- [ ] Тест: при `use_llm: false` ответ совпадает с rule-based

---

**Версия документа**: 1.0
**Последнее обновление**: 2026-06-25
**Связанные файлы**: см. раздел 11
