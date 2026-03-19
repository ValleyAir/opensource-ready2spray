# Task 3: Fix checkOllamaHealth Return Type

**Agent:** Aider
**Priority:** HIGH

## Files to Modify

1. `server/_core/ollama.ts` (checkOllamaHealth function)
2. `server/modelsRouter.ts` (lines 22-23) - verification only

## Changes Required

### 1. Update checkOllamaHealth in `server/_core/ollama.ts`

Change return type from `boolean` to `{ healthy: boolean; version?: string; error?: string }`

```typescript
// BEFORE
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/`);
    if (!response.ok) {
      return false;
    }
    const text = await response.text();
    return text.includes("Ollama is running");
  } catch (error) {
    console.error("Ollama health check failed:", error);
    return false;
  }
}

// AFTER
export async function checkOllamaHealth(): Promise<{ healthy: boolean; version?: string; error?: string }> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/`);

    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` };
    }

    const text = await response.text();
    const isHealthy = text.includes("Ollama is running");

    // Try to get version info
    let version: string | undefined;
    try {
      const versionResponse = await fetch(`${ENV.ollamaUrl}/api/version`);
      if (versionResponse.ok) {
        const versionData = await versionResponse.json();
        version = versionData.version;
      }
    } catch {
      // Version fetch is optional, ignore errors
    }

    return { healthy: isHealthy, version };
  } catch (error) {
    console.error("Ollama health check failed:", error);
    return { healthy: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
```

### 2. Verify modelsRouter.ts usage (should already work)

The modelsRouter.ts at lines 21-23 expects:
```typescript
const health = await checkOllamaHealth();
status.healthy = health.healthy;
status.message = health.healthy ? `Ollama running (v${health.version})` : `Ollama unreachable: ${health.error}`;
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "checkOllamaHealth\|modelsRouter"
```
