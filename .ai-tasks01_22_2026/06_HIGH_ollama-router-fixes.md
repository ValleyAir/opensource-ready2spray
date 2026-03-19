# Task 6: Fix ollamaRouter Type Issues

**Agent:** Aider
**Priority:** HIGH

## File to Modify

`server/ollamaRouter.ts` (lines 31, 55, 60)

## Changes Required

### 1. Fix Zod 4 z.record() calls (line 55)

Zod 4 changed the API - `z.record()` now requires 2 arguments (key schema, value schema):

```typescript
// BEFORE (Zod 3 style - broken in Zod 4)
schema: z.record(z.any())

// AFTER (Zod 4 style)
schema: z.record(z.string(), z.any())
```

### 2. Fix ResponseFormat type narrowing (line 66)

The zod schema allows any of the response format types but TypeScript needs explicit type narrowing:

```typescript
// BEFORE
.mutation(async ({ input }) => {
  try {
    const result = await invokeOllama({
      messages: input.messages,
      model: input.model,
      maxTokens: input.maxTokens,
      responseFormat: input.responseFormat  // Type error here
    });

// AFTER
.mutation(async ({ input }) => {
  try {
    // Convert zod-validated input to ResponseFormat type
    let responseFormat: { type: "text" } | { type: "json_object" } | { type: "json_schema"; json_schema: { name: string; schema: Record<string, unknown>; strict?: boolean } } | undefined;
    if (input.responseFormat) {
      if (input.responseFormat.type === "text") {
        responseFormat = { type: "text" };
      } else if (input.responseFormat.type === "json_object") {
        responseFormat = { type: "json_object" };
      } else if (input.responseFormat.type === "json_schema" && input.responseFormat.json_schema) {
        responseFormat = {
          type: "json_schema",
          json_schema: input.responseFormat.json_schema
        };
      }
    }
    const result = await invokeOllama({
      messages: input.messages,
      model: input.model,
      maxTokens: input.maxTokens,
      responseFormat
    });
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "ollamaRouter\|z.record"
```
