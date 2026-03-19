import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { calculateDriftRisk } from "./driftCalculator";

const driftInputSchema = z.object({
  windSpeed: z.number().min(0),
  windDirection: z.number().optional(),
  temperature: z.number(),
  humidity: z.number().min(0).max(100),
  boomHeight: z.number().min(0),
  dropletSize: z.enum(['Fine', 'Medium', 'Coarse', 'Very Coarse', 'Extra Coarse']),
  aircraftSpeed: z.number().min(0),
  distanceToSensitiveArea: z.number().optional(),
  jobId: z.number().optional(), // For saving context
});

export const driftRouter = router({
  calculate: protectedProcedure
    .input(driftInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = calculateDriftRisk(input);
      
      // If jobId is provided, we could save this to the job record or audit log
      // For now, we'll just log it if needed or return it
      
      if (input.jobId) {
        const { createAuditLog, getOrCreateUserOrganization } = await import("./db");
        const org = await getOrCreateUserOrganization(ctx.user.id);
        
        await createAuditLog({
          organizationId: org.id,
          userId: ctx.user.id,
          action: "view", // or "update" if we were modifying the job
          entityType: "job",
          entityId: input.jobId,
          entityName: "Drift Assessment",
          changes: JSON.stringify({ input, result }),
          ipAddress: ctx.req.ip || null,
          userAgent: ctx.req.get("user-agent") || null,
        });
      }

      return result;
    }),
});
