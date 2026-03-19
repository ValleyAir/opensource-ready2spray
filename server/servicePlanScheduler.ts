/**
 * Service Plan Scheduler
 * Automatically generates jobs from active service plans based on schedule
 */

import { getDb } from './db';
import { servicePlans, jobs } from '../drizzle/schema';

type ServicePlanType = 'monthly' | 'quarterly' | 'bi_monthly' | 'annual' | 'one_off';

/**
 * Calculate next service date based on plan type
 */
function calculateNextServiceDate(currentDate: Date, planType: ServicePlanType): Date {
  const nextDate = new Date(currentDate);
  
  switch (planType) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'bi_monthly':
      nextDate.setMonth(nextDate.getMonth() + 2);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'one_off':
      // One-off services don't repeat
      return currentDate;
  }
  
  return nextDate;
}

/**
 * Generate job from service plan
 */
async function generateJobFromServicePlan(plan: any) {
  const { eq, and } = await import('drizzle-orm');
  const db = await getDb();
  if (!db) {
    console.error('[ServicePlanScheduler] Database not available');
    return null;
  }

  try {
    // Parse default target pests if available
    let targetPests = '';
    if (plan.defaultTargetPests) {
      try {
        const pestsArray = typeof plan.defaultTargetPests === 'string' 
          ? JSON.parse(plan.defaultTargetPests) 
          : plan.defaultTargetPests;
        targetPests = Array.isArray(pestsArray) ? pestsArray.join(', ') : '';
      } catch (e) {
        console.warn('[ServicePlanScheduler] Failed to parse target pests:', e);
      }
    }

    // Get the organization's default 'Pending' status
    const { jobStatuses } = await import('../drizzle/schema');
    const defaultStatus = await db
      .select()
      .from(jobStatuses)
      .where(and(
        eq(jobStatuses.orgId, plan.orgId),
        eq(jobStatuses.isDefault, true),
        eq(jobStatuses.category, 'pending')
      ))
      .limit(1);

    const statusId = defaultStatus.length > 0 ? defaultStatus[0].id : null;

    // Create job from service plan
    const newJob = await db.insert(jobs).values({
      orgId: plan.orgId,
      customerId: plan.customerId,
      siteId: plan.siteId,
      servicePlanId: plan.id,
      title: `${plan.planName} - Scheduled Service`,
      description: `Automatically generated from service plan: ${plan.planName}`,
      jobType: 'pest_control',
      statusId: statusId,
      priority: 'medium',
      scheduledStart: plan.nextServiceDate,
      scheduledEnd: new Date(new Date(plan.nextServiceDate).getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      targetPest: targetPests,
      notes: plan.notes || '',
    }).returning();

    console.log(`[ServicePlanScheduler] Generated job ${newJob[0].id} from service plan ${plan.id}`);
    return newJob[0];
  } catch (error) {
    console.error(`[ServicePlanScheduler] Failed to generate job from plan ${plan.id}:`, error);
    return null;
  }
}

/**
 * Update service plan with next service date
 */
async function updateServicePlanNextDate(planId: number, nextDate: Date) {
  const { eq } = await import('drizzle-orm');
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(servicePlans)
      .set({ 
        nextServiceDate: nextDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        updatedAt: new Date() 
      })
      .where(eq(servicePlans.id, planId));

    console.log(`[ServicePlanScheduler] Updated service plan ${planId} next service date to ${nextDate.toISOString()}`);
  } catch (error) {
    console.error(`[ServicePlanScheduler] Failed to update service plan ${planId}:`, error);
  }
}

/**
 * Process all active service plans that are due for job generation
 */
export async function processServicePlans() {
  const { eq, and, lte, or, isNull } = await import('drizzle-orm');
  const db = await getDb();
  if (!db) {
    console.error('[ServicePlanScheduler] Database not available');
    return { processed: 0, generated: 0, errors: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  try {
    // Find all active service plans where nextServiceDate is today or in the past
    const duePlans = await db
      .select()
      .from(servicePlans)
      .where(
        and(
          eq(servicePlans.status, 'active'),
          or(
            lte(servicePlans.nextServiceDate, today.toISOString().split('T')[0]),
            isNull(servicePlans.nextServiceDate) // Plans without next service date
          )
        )
      );

    console.log(`[ServicePlanScheduler] Found ${duePlans.length} service plans due for processing`);

    let processed = 0;
    let generated = 0;
    let errors = 0;

    for (const plan of duePlans) {
      processed++;

      // Skip one-off plans that have already been serviced
      if (plan.planType === 'one_off' && plan.nextServiceDate) {
        console.log(`[ServicePlanScheduler] Skipping one-off plan ${plan.id} - already serviced`);
        continue;
      }

      // Generate job from service plan
      const job = await generateJobFromServicePlan(plan);
      
      if (job) {
        generated++;

        // Calculate and update next service date (except for one-off)
        if (plan.planType !== 'one_off') {
          const currentServiceDate = plan.nextServiceDate 
            ? new Date(plan.nextServiceDate) 
            : new Date();
          const nextServiceDate = calculateNextServiceDate(currentServiceDate, plan.planType as ServicePlanType);
          await updateServicePlanNextDate(plan.id, nextServiceDate);
        } else {
          // Mark one-off plan as completed
          await db
            .update(servicePlans)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(servicePlans.id, plan.id));
        }
      } else {
        errors++;
      }
    }

    console.log(`[ServicePlanScheduler] Processing complete: ${processed} processed, ${generated} jobs generated, ${errors} errors`);
    return { processed, generated, errors };
  } catch (error) {
    console.error('[ServicePlanScheduler] Error processing service plans:', error);
    return { processed: 0, generated: 0, errors: 1 };
  }
}

/**
 * Manual trigger for service plan processing (can be called from API endpoint)
 */
export async function triggerServicePlanProcessing() {
  console.log('[ServicePlanScheduler] Manual trigger initiated');
  return await processServicePlans();
}
