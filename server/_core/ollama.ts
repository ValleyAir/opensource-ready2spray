import { InvokeParams, InvokeResult } from "@/server_core/llm";
import { ENV } from "./env";

export async function invokeOllama(params: InvokeParams): Promise<InvokeResult> {
  const { messages, tools, toolChoice, maxTokens, responseFormat, response_format } = params;

  const payload: any = {
    model: ENV.ollamaModel,
    messages,
    stream: false, // For now, we'll use non-streaming for simplicity
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  if (toolChoice) {
    payload.tool_choice = toolChoice;
  }

  if (maxTokens) {
    payload.options = {
      ...(payload.options || {}),
      num_predict: maxTokens,
    };
  }

  const resolvedFormat = responseFormat || response_format;
  if (resolvedFormat) {
    // Ollama expects format: "json" (a string), not the OpenAI-style response_format object
    if (resolvedFormat.type === "json_object" || resolvedFormat.type === "json_schema") {
      payload.format = "json";
    }
  }

  try {
    const response = await fetch(`${ENV.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert Ollama response format to our expected format
    return {
      id: result.id || Date.now().toString(),
      created: Date.now(),
      model: result.model || ENV.ollamaModel,
      choices: [
        {
          index: 0,
          message: {
            role: result.message?.role || "assistant",
            content: result.message?.content || "",
          },
          finish_reason: result.done_reason || "stop",
        }
      ],
      usage: result.usage ? {
        prompt_tokens: result.usage.prompt_eval_count || 0,
        completion_tokens: result.usage.eval_count || 0,
        total_tokens: (result.usage.prompt_eval_count || 0) + (result.usage.eval_count || 0),
      } : undefined,
    };
  } catch (error) {
    console.error("Ollama invoke error:", error);
    throw new Error(`Failed to invoke Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listOllamaModels(): Promise<any[]> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error("Failed to list Ollama models:", error);
    return [];
  }
}

export async function checkOllamaHealth(): Promise<{ healthy: boolean; version?: string; error?: string }> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/`);

    if (!response.ok) {
      return { healthy: false, error: `Ollama returned status ${response.status}` };
    }

    const text = await response.text();
    if (!text.includes("Ollama is running")) {
      return { healthy: false, error: "Unexpected response from Ollama" };
    }

    // Try to get version info
    let version: string | undefined;
    try {
      const versionRes = await fetch(`${ENV.ollamaUrl}/api/version`);
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        version = versionData.version;
      }
    } catch {
      // Version endpoint is optional
    }

    return { healthy: true, version };
  } catch (error) {
    return { healthy: false, error: error instanceof Error ? error.message : "Failed to connect to Ollama" };
  }
}

export async function pullOllamaModel(name: string): Promise<void> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/api/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama pull error: ${response.status} ${response.statusText}`);
    }

    // For simplicity, we're not handling the streaming response
    // In a real implementation, you'd want to process the streaming response
    await response.json();
  } catch (error) {
    console.error("Failed to pull Ollama model:", error);
    throw error;
  }
}

export async function generateOllamaEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${ENV.ollamaUrl}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ENV.ollamaModel,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings?.[0] || [];
  } catch (error) {
    console.error("Failed to generate Ollama embeddings:", error);
    throw error;
  }
}
