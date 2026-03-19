# Task 7: Fix AISettings Model Type Properties

**Agent:** Aider
**Priority:** HIGH

## Files to Modify

1. `server/modelsRouter.ts` (listAvailable procedure)
2. `client/src/pages/AISettings.tsx` (lines 142, 162, 182, 214, 218) - optional verification

## Changes Required

### 1. Add optional `size` and `modified` properties to Anthropic/Forge models

In `server/modelsRouter.ts`, the `listAvailable` procedure returns models from different providers. Ollama models have `size` and `modified`, but Anthropic and Forge don't. Add explicit undefined values for type consistency:

```typescript
// BEFORE
} else if (provider === "anthropic") {
  return [
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "anthropic" },
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "anthropic" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic" },
  ];
} else if (provider === "forge") {
  return [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "forge" },
  ];
}

// AFTER
} else if (provider === "anthropic") {
  return [
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", provider: "anthropic", size: undefined, modified: undefined },
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "anthropic", size: undefined, modified: undefined },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", size: undefined, modified: undefined },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic", size: undefined, modified: undefined },
  ];
} else if (provider === "forge") {
  return [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "forge", size: undefined, modified: undefined },
  ];
}
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "modelsRouter\|AISettings\|model.size"
```
