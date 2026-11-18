// Spec: PlanDto (SaaS). Missing limits (null) = unlimited; yearlyPrice null = no yearly billing
export interface IPlan {
  id?: string
  code?: string
  name?: string
  description?: string | null
  monthlyPrice?: number | null
  yearlyPrice?: number | null
  maxUsers?: number | null
  maxEmployees?: number | null
  storageLimitGb?: number | null
  trialDays?: number | null
  aiIntegration?: boolean
  defaultPlan?: boolean
  enabled?: boolean
}

// Spec: PlanForm (hrm-be SaasDtos.java). PUT replaces every field: omitted limits become unlimited
export interface IPlanPayload {
  code: string
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice?: number
  maxUsers?: number
  maxEmployees?: number
  storageLimitGb?: number
  trialDays: number
  aiIntegration: boolean
  defaultPlan: boolean
  enabled: boolean
}
