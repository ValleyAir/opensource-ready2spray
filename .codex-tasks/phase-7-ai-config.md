# Phase 7: AI Model Configuration (Ollama Priority + Claude Fallback)

## Goal
Configure the AI system to prefer local Ollama models by default, with automatic fallback to Anthropic Claude when Ollama is unavailable. Vision tasks (screenshot extraction) should always use Claude.

---

## Changes Required

### 1. `server/_core/env.ts` - Default to Ollama
Change the default LLM provider:
```typescript
// Before:
llmProvider: process.env.LLM_PROVIDER || "anthropic",

// After:
llmProvider: process.env.LLM_PROVIDER || "ollama",
```

### 2. `server/_core/llm.ts` - Add fallback logic
Modify the `invokeLLM` function to support:

**A. Per-call provider override:**
Add an optional `provider` parameter to the invocation options:
```typescript
interface InvokeLLMOptions {
  // ... existing options
  provider?: "ollama" | "anthropic" | "forge"; // Override the default provider for this call
}
```

When `provider` is specified, use that provider instead of `ENV.llmProvider`.

**B. Automatic Ollama -> Anthropic fallback:**
When Ollama is the active provider and a call fails with:
- Connection refused (ECONNREFUSED)
- Connection timeout
- Model not found

Automatically retry the same call with Anthropic. Log a warning:
```typescript
console.warn("[LLM] Ollama unavailable, falling back to Anthropic");
```

**Implementation approach:**
```typescript
export async function invokeLLM(options: InvokeLLMOptions) {
  const provider = options.provider || ENV.llmProvider;

  if (provider === "ollama") {
    try {
      return await invokeOllama(options);
    } catch (error: any) {
      // Auto-fallback to Anthropic on connection errors
      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.message?.includes("model") ||
        error.message?.includes("not found")
      ) {
        console.warn("[LLM] Ollama unavailable, falling back to Anthropic:", error.message);
        if (ENV.anthropicApiKey) {
          return await invokeAnthropic(options);
        }
      }
      throw error;
    }
  }

  if (provider === "anthropic") {
    return await invokeAnthropic(options);
  }

  // Default: forge
  return await invokeForge(options);
}
```

### 3. `server/routers.ts` - Vision tasks always use Anthropic
In the `products.extractFromScreenshot` procedure, force Anthropic for vision:
```typescript
const result = await invokeLLM({
  messages: [...],
  response_format: {...},
  provider: "anthropic", // Always use Claude for vision/image tasks
});
```

Similarly for `products.extractFromPdf` if it uses LLM.

### 4. `client/src/pages/AISettings.tsx` - Simplified provider UI
Update the AI Settings page to show:

**Provider Status Section:**
- Current active provider (from `models.getProviderStatus`)
- Ollama status: "Connected" (green) or "Disconnected" (red) with URL shown
- Anthropic status: "API Key Configured" (green) or "No API Key" (yellow)
- Active model name

**Provider Selection:**
- Radio buttons or toggle: Ollama / Anthropic
- Calls `models.updateConfig` to change provider
- If selecting Ollama and it's not running, show warning

**Model Selection (Ollama only):**
- Dropdown of available models (from `models.listAvailable`)
- "Pull Model" button to download new models

**Remove:**
- Organization-level AI config complexity
- Credit tracking UI
- Any Stripe-related AI usage UI

### 5. `server/modelsRouter.ts` - Simplify
Update `getProviderStatus` to include health check info:
```typescript
{
  activeProvider: ENV.llmProvider,
  ollamaStatus: await checkOllamaHealth(), // true/false
  ollamaUrl: ENV.ollamaUrl,
  ollamaModel: ENV.ollamaModel,
  anthropicConfigured: !!ENV.anthropicApiKey,
  anthropicModel: ENV.anthropicModel,
}
```

---

## Provider Behavior Summary

| Scenario | Provider Used | Notes |
|----------|--------------|-------|
| Ollama running, text task | Ollama | Default behavior |
| Ollama down, text task | Anthropic | Auto-fallback |
| Vision/image task | Anthropic | Always (provider override) |
| No Ollama, no Anthropic key | Error | Clear error message |
| User selects Anthropic | Anthropic | Manual override via settings |

---

## Verification
```bash
npm run build
```

**With Ollama running locally:**
- AI chat uses Ollama (check server logs for `[LLM] Using ollama`)
- AI Settings shows "Ollama: Connected"

**With Ollama NOT running:**
- AI chat falls back to Anthropic (check server logs for fallback warning)
- AI Settings shows "Ollama: Disconnected"

**Product screenshot extraction:**
- Upload a product screenshot
- Server logs show Anthropic being used (not Ollama)
- Extraction returns correct product data

**AI Settings page:**
- Shows provider status accurately
- Can switch between Ollama and Anthropic
- Model list populates for Ollama
