# Task 9: Fix AI Chat to Use Ollama Provider

**Agent:** Goose
**Priority:** CRITICAL

## Files to Modify

1. `server/routers.ts` (ai.sendMessage procedure, around line 789)
2. `.env` file

## Changes Required

### 1. Replace getClaudeResponse with invokeLLM in routers.ts

Find the `sendMessage` mutation in the `ai` router (around line 785-900) and replace the hardcoded Claude call:

```typescript
// BEFORE
const { createMessage, getOrCreateUserOrganization, getMessagesByConversationId } = await import("./db");
const { getClaudeResponse } = await import("./claude");

// ... later in the code ...
const response = await getClaudeResponse({
  messages,
  systemPrompt: `You are a helpful agricultural operations assistant...`,
  tools: mcpTools,
  maxTokens: 2048,
});

// AFTER
const { createMessage, getOrCreateUserOrganization, getMessagesByConversationId } = await import("./db");
const { invokeLLM } = await import("./_core/llm");

// ... replace the AI call with ...
const systemPrompt = `You are a helpful agricultural operations assistant for Ready2Spray. You help with job scheduling, weather conditions, EPA compliance, and agricultural operations.

Be concise and practical. When presenting data, format it clearly.`;

// Add system message at the start
const llmMessages = [
  { role: 'system' as const, content: systemPrompt },
  ...messages,
];

const response = await invokeLLM({
  messages: llmMessages,
  maxTokens: 2048,
});

// Extract content from the LLM response
let assistantContent = "";
const choice = response.choices[0];
if (choice && choice.message) {
  const content = choice.message.content;
  if (typeof content === 'string') {
    assistantContent = content;
  } else if (Array.isArray(content)) {
    assistantContent = content.map(part =>
      typeof part === 'string' ? part :
      part.type === 'text' ? part.text :
      JSON.stringify(part)
    ).join('');
  }
}

if (!assistantContent) {
  assistantContent = "I apologize, but I couldn't generate a response. Please try again.";
}
```

### 2. Update .env file with Ollama settings

Add these lines to `.env`:

```env
# LLM Provider Configuration
LLM_PROVIDER=ollama
OLLAMA_URL=http://192.168.0.139:11434
OLLAMA_MODEL=llama3.2
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "routers.ts\|invokeLLM"
# Then test:
pnpm dev
# Open http://localhost:3333 and test AI Chat
```
