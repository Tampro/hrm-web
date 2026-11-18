// Spec: CompanyDto.status / CompanyStatusForm. All = filter tab only (team rule: "All" is an enum member)
export enum ECompanyStatus {
  All = 'ALL',
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED'
}

// Spec: CompanyDto.subscriptionStatus
export enum ESubscriptionStatus {
  None = 'NONE',
  Trial = 'TRIAL',
  Active = 'ACTIVE',
  Expired = 'EXPIRED'
}

// Spec: UpgradePlanForm.billingCycle
export enum EBillingCycle {
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY'
}
