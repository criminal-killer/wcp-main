/**
 * packages/shared/src/index.ts
 * Barrel export for @chatevo/shared
 */
export * from './env'

// Plan types — shared between merchant and admin
export type PlanId = 'starter' | 'pro' | 'elite'

export const PLAN_PRICES: Record<PlanId, number> = {
  starter: 29,
  pro:     59,
  elite:   99,
}

export const PLAN_LIMITS: Record<PlanId, { products: number; ai_custom: boolean; white_label: boolean }> = {
  starter: { products: 100,  ai_custom: false, white_label: false },
  pro:     { products: 500,  ai_custom: true,  white_label: false },
  elite:   { products: 5000, ai_custom: true,  white_label: true  },
}

export function isValidPlan(plan: string): plan is PlanId {
  return plan === 'starter' || plan === 'pro' || plan === 'elite'
}

export function normalizePlan(plan: string): PlanId {
  if (plan === 'growth')  return 'pro'
  if (plan === 'premium') return 'elite'
  if (isValidPlan(plan))  return plan
  return 'starter'
}
