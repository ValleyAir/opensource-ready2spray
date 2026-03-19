import Anthropic from '@anthropic-ai/sdk';
import { ENV } from './_core/env';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient() {
  if (!anthropicClient && process.env.AnthropicAPI) {
    anthropicClient = new Anthropic({
      apiKey: process.env.AnthropicAPI,
    });
  }
  return anthropicClient;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ClaudeStreamOptions {
  messages: ClaudeMessage[];
  systemPrompt?: string;
  tools?: ClaudeTool[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Stream Claude AI responses with optional tool calling support
 */
export async function* streamClaudeResponse(options: ClaudeStreamOptions) {
  const client = getAnthropicClient();
  
  if (!client) {
    throw new Error('Anthropic API key not configured');
  }

  const {
    messages,
    systemPrompt = 'You are a helpful AI assistant for Ready2Spray, an agricultural operations management platform.',
    tools = [],
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  try {
    const stream = await client.messages.stream({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      ...(tools.length > 0 && { tools }),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          type: 'text',
          content: event.delta.text,
        };
      } else if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        yield {
          type: 'tool_use',
          toolName: event.content_block.name,
          toolInput: event.content_block.input,
        };
      } else if (event.type === 'message_stop') {
        const finalMessage = await stream.finalMessage();
        yield {
          type: 'done',
          usage: finalMessage.usage,
        };
      }
    }
  } catch (error: any) {
    console.error('[Claude] Error streaming response:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Get non-streaming Claude response
 */
export async function getClaudeResponse(options: ClaudeStreamOptions) {
  const client = getAnthropicClient();
  
  if (!client) {
    throw new Error('Anthropic API key not configured');
  }

  const {
    messages,
    systemPrompt = 'You are a helpful AI assistant for Ready2Spray, an agricultural operations management platform.',
    tools = [],
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  try {
    const response = await client.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      ...(tools.length > 0 && { tools }),
    });

    return {
      content: response.content,
      usage: response.usage,
      stopReason: response.stop_reason,
    };
  } catch (error: any) {
    console.error('[Claude] Error getting response:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}
