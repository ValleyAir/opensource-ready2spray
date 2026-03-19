import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getOrganizationAiConfig, updateOrganizationAiConfig, getOrCreateUserOrganization } from "./db";
import { checkOllamaHealth, listOllamaModels, pullOllamaModel } from "./_core/ollama";
import { ENV } from "./_core/env";

export const modelsRouter = router({
  getProviderStatus: protectedProcedure.query(async () => {
    // Current provider from ENV or DB overrides?
    // For now, we report the ENV configuration, but potentially DB config could override per org
    const provider = ENV.llmProvider;
    
    let status = {
      provider,
      healthy: true,
      message: "Provider active",
      details: {} as any,
    };

    if (provider === "ollama") {
      const health = await checkOllamaHealth();
      status.healthy = health.healthy;
      status.message = health.healthy ? `Ollama running (v${health.version})` : `Ollama unreachable: ${health.error}`;
      status.details = { url: ENV.ollamaUrl };
    } else if (provider === "anthropic") {
      status.healthy = !!ENV.anthropicApiKey;
      status.message = status.healthy ? "Anthropic API key configured" : "Anthropic API key missing";
    }

    return status;
  }),

  listAvailable: protectedProcedure.query(async () => {
    const provider = ENV.llmProvider;
    
    if (provider === "ollama") {
      try {
        const models = await listOllamaModels();
        return models.map(m => ({
          id: m.name,
          name: m.name,
          size: m.size,
          modified: m.modified_at,
          provider: "ollama",
        }));
      } catch (error) {
        console.error("Failed to list Ollama models", error);
        return [];
      }
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
    
    return [];
  }),

  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const org = await getOrCreateUserOrganization(ctx.user.id);
    const config = await getOrganizationAiConfig(org.id);
    
    return config || {
      provider: ENV.llmProvider,
      chatModel: ENV.llmProvider === "ollama" ? ENV.ollamaModel : "claude-3-7-sonnet-20250219",
      analysisModel: ENV.llmProvider === "ollama" ? ENV.ollamaModel : "claude-3-7-sonnet-20250219",
      complianceModel: ENV.llmProvider === "ollama" ? ENV.ollamaModel : "claude-3-7-sonnet-20250219",
    };
  }),

  updateConfig: adminProcedure
    .input(z.object({
      provider: z.enum(["ollama", "anthropic", "forge"]).optional(),
      chatModel: z.string().optional(),
      analysisModel: z.string().optional(),
      complianceModel: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrCreateUserOrganization(ctx.user.id);
      return await updateOrganizationAiConfig(org.id, input);
    }),

  pullModel: adminProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      if (ENV.llmProvider !== "ollama") {
        throw new Error("Cannot pull models when provider is not Ollama");
      }
      
      await pullOllamaModel(input.name);
      return { success: true, message: `Started pulling model ${input.name}` };
    }),
});
