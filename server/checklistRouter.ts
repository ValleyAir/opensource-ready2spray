import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createPreFlightChecklist, getPreFlightChecklistsByJobId, getPreFlightChecklistById, getJobV2WithProduct, getPersonnelByOrgId, getEquipmentByOrgId, getOrCreateUserOrganization } from "./db";
import { getCurrentWeather, evaluateSprayConditions } from "./weather";

export const checklistRouter = router({
  getForJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const job = await getJobV2WithProduct(input.jobId);
      if (!job) throw new Error("Job not found");

      const org = await getOrCreateUserOrganization(ctx.user.id);
      
      // Get current weather if location is available
      let weather = null;
      let sprayWindow = null;
      
      if (job.latitude && job.longitude) {
        try {
          weather = await getCurrentWeather(parseFloat(job.latitude.toString()), parseFloat(job.longitude.toString()));
          sprayWindow = evaluateSprayConditions(weather);
        } catch (e) {
          console.error("Failed to fetch weather for checklist", e);
        }
      }

      // Get pilots and aircraft for selection
      const personnel = await getPersonnelByOrgId(org.id);
      const pilots = personnel.filter(p => p.role === 'pilot');
      const equipment = await getEquipmentByOrgId(org.id);
      const aircraft = equipment.filter(e => e.equipmentType === 'plane' || e.equipmentType === 'helicopter' || e.equipmentType === 'ulv');

      return {
        job,
        weather: weather ? { ...weather, sprayWindow } : null,
        pilots,
        aircraft,
        currentUser: ctx.user,
      };
    }),

  submit: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      pilotId: z.number().optional(),
      aircraftId: z.number().optional(),
      checklistData: z.record(z.any()), // JSON data for the checklist items
      weatherSnapshot: z.any().optional(),
      signedBy: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const checklist = await createPreFlightChecklist({
        jobId: input.jobId,
        pilotId: input.pilotId,
        aircraftId: input.aircraftId,
        checklistData: input.checklistData,
        weatherSnapshot: input.weatherSnapshot,
        signedBy: input.signedBy,
        signedAt: new Date(),
      });

      return checklist;
    }),

  getHistory: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return await getPreFlightChecklistsByJobId(input.jobId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getPreFlightChecklistById(input.id);
    }),
});
