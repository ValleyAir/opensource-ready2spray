# Task 4: Fix LLM Type Issues

**Agent:** Aider
**Priority:** HIGH

## File to Modify

`server/_core/llm.ts` (lines 376, 415)

## Changes Required

### 1. Add `model` to InvokeParams type (around line 73)

```typescript
export type InvokeParams = {
  messages: Message[];
  model?: string;  // ADD THIS LINE
  tools?: Tool[];
  // ... rest of properties
};
```

### 2. Fix MessageContent type access in invokeAnthropic (around line 376)

The issue is that `part` could be a string (from MessageContent type), but we're accessing `.type` on it.

```typescript
// BEFORE
msg.content.map(part =>
  part.type === "text" ? part.text : part
).join("\n")

// AFTER
msg.content.map(part => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  return JSON.stringify(part);
}).join("\n")
```

### 3. Fix ContentBlock type access for response parsing (around line 415)

Anthropic's ContentBlock has different shapes (TextBlock, ToolUseBlock, etc.) and not all have `.text`.

```typescript
// BEFORE
content: response.content.map(c => c.text || "").join(""),

// AFTER
content: response.content.map(c => {
  if (c.type === "text") return c.text;
  if (c.type === "tool_use") return JSON.stringify(c);
  return "";
}).join(""),
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "llm.ts\|MessageContent\|ContentBlock"
```
