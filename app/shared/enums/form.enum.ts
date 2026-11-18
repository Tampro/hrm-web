export enum ELoginFormKey {
  Username = 'username',
  Password = 'password'
}

export enum ECompanyFilterFormKey {
  Keyword = 'keyword',
  CreatedFrom = 'createdFrom',
  CreatedTo = 'createdTo'
}

export enum ECompanyFormKey {
  Code = 'code',
  Name = 'name',
  Email = 'email',
  EnableLogin = 'enableLogin',
  AdminUsername = 'adminUsername',
  AdminEmail = 'adminEmail',
  AdminFullName = 'adminFullName'
}

export enum EResetPasswordFormKey {
  UserId = 'userId',
  NewPassword = 'newPassword'
}

export enum EUpgradePlanFormKey {
  PlanId = 'planId',
  BillingCycle = 'billingCycle'
}

export enum EPlanFormKey {
  Code = 'code',
  Name = 'name',
  Description = 'description',
  MonthlyPrice = 'monthlyPrice',
  YearlyPrice = 'yearlyPrice',
  MaxUsers = 'maxUsers',
  MaxEmployees = 'maxEmployees',
  StorageLimitGb = 'storageLimitGb',
  EnableTrial = 'enableTrial',
  TrialDays = 'trialDays',
  AiIntegration = 'aiIntegration',
  Enabled = 'enabled',
  DefaultPlan = 'defaultPlan'
}

export enum ESaasFilterFormKey {
  Keyword = 'keyword',
  DateFrom = 'dateFrom',
  DateTo = 'dateTo'
}

export enum EDecisionFormKey {
  Notes = 'notes'
}

export enum ECouponFilterFormKey {
  Keyword = 'keyword',
  Type = 'type',
  DateFrom = 'dateFrom',
  DateTo = 'dateTo'
}

export enum ECouponFormKey {
  Name = 'name',
  Type = 'type',
  DiscountValue = 'discountValue',
  CodeGeneration = 'codeGeneration',
  Code = 'code',
  MinimumSpend = 'minimumSpend',
  MaximumSpend = 'maximumSpend',
  UseLimitTotal = 'useLimitTotal',
  UseLimitPerCompany = 'useLimitPerCompany',
  ExpiryDate = 'expiryDate'
}

export enum ECurrencyFilterFormKey {
  Keyword = 'keyword'
}

export enum ECurrencyFormKey {
  Name = 'name',
  Code = 'code',
  Symbol = 'symbol',
  Description = 'description',
  DefaultCurrency = 'defaultCurrency'
}
