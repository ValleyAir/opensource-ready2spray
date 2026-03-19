import { router, publicProcedure } from "@/server/_core/trpc";
import { listOllamaModels, checkOllamaHealth, pullOllamaModel, invokeOllama } from "@/server/_core/ollama";
import { z } from "zod";

export const ollamaRouter = router({
  health: publicProcedure.query(async () => {
    const isHealthy = await checkOllamaHealth();
    return { 
      status: isHealthy ? "healthy" : "unhealthy",
      isHealthy,
      url: process.env.OLLAMA_URL || "http://localhost:11434"
    };
  }),
  
  models: publicProcedure.query(async () => {
    try {
      const models = await listOllamaModels();
      return { models };
    } catch (error) {
      return { 
        error: "Failed to fetch models",
        models: []
      };
    }
  }),
  
  pull: publicProcedure
    .input(z.object({
      name: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await pullOllamaModel(input.name);
        return { success: true, message: `Model ${input.name} pulled successfully` };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to pull model"
        };
      }
    }),
  
  chat: publicProcedure
    .input(z.object({
      model: z.string(),
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string()
      })),
      maxTokens: z.number().optional(),
      responseFormat: z.object({
        type: z.enum(["text", "json_object", "json_schema"]),
        json_schema: z.object({
          name: z.string(),
          schema: z.record(z.any()),
          strict: z.boolean().optional()
        }).optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await invokeOllama({
          messages: input.messages,
          model: input.model,
          maxTokens: input.maxTokens,
          responseFormat: input.responseFormat
        });
        return result;
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : "Failed to generate response"
        };
      }
    })
});
