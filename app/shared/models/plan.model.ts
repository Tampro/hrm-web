// Spec: PlanDto (SaaS)
export interface IPlan {
  id?: string
  code?: string
  name?: string
  description?: string
  monthlyPrice?: number
  yearlyPrice?: number | null
  maxUsers?: number | null
  maxEmployees?: number | null
  storageLimitGb?: number | null
  trialDays?: number | null
  aiIntegration?: boolean
  defaultPlan?: boolean
  enabled?: boolean
}
