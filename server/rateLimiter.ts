/**
 * Rate limiting and usage tracking for AI API calls
 * Implements per-organization throttling to control costs
 */

interface RateLimitConfig {
  maxRequestsPerHour: number;
  maxTokensPerDay: number;
  maxTokensPerMonth: number;
}

interface UsageRecord {
  organizationId: number;
  requestCount: number;
  tokensUsed: number;
  lastReset: Date;
  dailyTokens: number;
  dailyReset: Date;
  monthlyTokens: number;
  monthlyReset: Date;
}

// In-memory storage (in production, use Redis or database)
const usageStore = new Map<number, UsageRecord>();

// Default rate limits (can be customized per organization/subscription tier)
const DEFAULT_LIMITS: RateLimitConfig = {
  maxRequestsPerHour: 100,
  maxTokensPerDay: 50000,
  maxTokensPerMonth: 1000000,
};

/**
 * Check if organization is within rate limits
 */
export async function checkRateLimit(organizationId: number): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: {
    requestsThisHour: number;
    tokensToday: number;
    tokensThisMonth: number;
  };
}> {
  const now = new Date();
  let usage = usageStore.get(organizationId);

  // Initialize usage record if not exists
  if (!usage) {
    usage = {
      organizationId,
      requestCount: 0,
      tokensUsed: 0,
      lastReset: now,
      dailyTokens: 0,
      dailyReset: now,
      monthlyTokens: 0,
      monthlyReset: now,
    };
    usageStore.set(organizationId, usage);
  }

  // Reset hourly counter if needed
  const hoursSinceReset = (now.getTime() - usage.lastReset.getTime()) / (1000 * 60 * 60);
  if (hoursSinceReset >= 1) {
    usage.requestCount = 0;
    usage.lastReset = now;
  }

  // Reset daily counter if needed
  const daysSinceReset = (now.getTime() - usage.dailyReset.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReset >= 1) {
    usage.dailyTokens = 0;
    usage.dailyReset = now;
  }

  // Reset monthly counter if needed
  const monthsSinceReset = 
    (now.getFullYear() - usage.monthlyReset.getFullYear()) * 12 +
    (now.getMonth() - usage.monthlyReset.getMonth());
  if (monthsSinceReset >= 1) {
    usage.monthlyTokens = 0;
    usage.monthlyReset = now;
  }

  // Check limits
  if (usage.requestCount >= DEFAULT_LIMITS.maxRequestsPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${DEFAULT_LIMITS.maxRequestsPerHour} requests per hour`,
    };
  }

  if (usage.dailyTokens >= DEFAULT_LIMITS.maxTokensPerDay) {
    return {
      allowed: false,
      reason: `Daily token limit exceeded: ${DEFAULT_LIMITS.maxTokensPerDay} tokens per day`,
    };
  }

  if (usage.monthlyTokens >= DEFAULT_LIMITS.maxTokensPerMonth) {
    return {
      allowed: false,
      reason: `Monthly token limit exceeded: ${DEFAULT_LIMITS.maxTokensPerMonth} tokens per month`,
    };
  }

  return {
    allowed: true,
    remaining: {
      requestsThisHour: DEFAULT_LIMITS.maxRequestsPerHour - usage.requestCount,
      tokensToday: DEFAULT_LIMITS.maxTokensPerDay - usage.dailyTokens,
      tokensThisMonth: DEFAULT_LIMITS.maxTokensPerMonth - usage.monthlyTokens,
    },
  };
}

/**
 * Record API usage after a successful request
 */
export async function recordUsage(organizationId: number, tokensUsed: number): Promise<void> {
  const usage = usageStore.get(organizationId);
  
  if (!usage) {
    // Initialize if not exists
    const now = new Date();
    usageStore.set(organizationId, {
      organizationId,
      requestCount: 1,
      tokensUsed,
      lastReset: now,
      dailyTokens: tokensUsed,
      dailyReset: now,
      monthlyTokens: tokensUsed,
      monthlyReset: now,
    });
  } else {
    // Update existing record
    usage.requestCount += 1;
    usage.tokensUsed += tokensUsed;
    usage.dailyTokens += tokensUsed;
    usage.monthlyTokens += tokensUsed;
  }

  // Also save to database for persistence
  try {
    const { getDb } = await import('./db');
    const { aiUsage } = await import('../drizzle/schema');
    const db = await getDb();
    
    if (db) {
      await db.insert(aiUsage).values({
        orgId: organizationId,
        userId: 1, // TODO: Pass actual userId
        model: 'claude-3-7-sonnet-20250219',
        inputTokens: Math.floor(tokensUsed * 0.4),
        outputTokens: Math.floor(tokensUsed * 0.6),
        totalTokens: tokensUsed,
        cost: calculateCost(tokensUsed).toFixed(4),
      });
    }
  } catch (error) {
    console.error('[RateLimiter] Failed to save usage to database:', error);
  }
}

/**
 * Calculate cost based on tokens used
 * Claude 3.5 Sonnet pricing: $3/million input tokens, $15/million output tokens
 * Simplified calculation assuming 50/50 split
 */
function calculateCost(tokens: number): number {
  const avgCostPerToken = (3 + 15) / 2 / 1000000;
  return tokens * avgCostPerToken;
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(organizationId: number): Promise<{
  hourly: { requests: number; limit: number };
  daily: { tokens: number; limit: number };
  monthly: { tokens: number; limit: number; cost: number };
}> {
  const usage = usageStore.get(organizationId);

  if (!usage) {
    return {
      hourly: { requests: 0, limit: DEFAULT_LIMITS.maxRequestsPerHour },
      daily: { tokens: 0, limit: DEFAULT_LIMITS.maxTokensPerDay },
      monthly: { 
        tokens: 0, 
        limit: DEFAULT_LIMITS.maxTokensPerMonth,
        cost: 0,
      },
    };
  }

  return {
    hourly: { 
      requests: usage.requestCount, 
      limit: DEFAULT_LIMITS.maxRequestsPerHour,
    },
    daily: { 
      tokens: usage.dailyTokens, 
      limit: DEFAULT_LIMITS.maxTokensPerDay,
    },
    monthly: { 
      tokens: usage.monthlyTokens, 
      limit: DEFAULT_LIMITS.maxTokensPerMonth,
      cost: calculateCost(usage.monthlyTokens),
    },
  };
}
