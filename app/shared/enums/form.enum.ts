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
