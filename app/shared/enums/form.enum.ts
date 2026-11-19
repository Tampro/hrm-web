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

export enum EKeywordFilterFormKey {
  Keyword = 'keyword'
}

export enum ECurrencyFormKey {
  Name = 'name',
  Code = 'code',
  Symbol = 'symbol',
  Description = 'description',
  DefaultCurrency = 'defaultCurrency'
}

export enum EReferralSettingsFormKey {
  Enabled = 'enabled',
  CommissionPercentage = 'commissionPercentage',
  ThresholdAmount = 'thresholdAmount',
  Guidelines = 'guidelines'
}

// Settings forms: keys = backend field names (hrm-be SettingsDtos.java)
export enum ESystemSettingsFormKey {
  DefaultLanguage = 'defaultLanguage',
  DateFormat = 'dateFormat',
  TimeFormat = 'timeFormat',
  CalendarStartDay = 'calendarStartDay',
  DefaultTimezone = 'defaultTimezone',
  EmailVerification = 'emailVerification',
  LandingPage = 'landingPage',
  UserRegistration = 'userRegistration',
  TermsUrl = 'termsUrl'
}

export enum EBrandSettingsFormKey {
  LogoDarkUrl = 'logoDarkUrl',
  LogoLightUrl = 'logoLightUrl',
  FaviconUrl = 'faviconUrl',
  TitleText = 'titleText',
  FooterText = 'footerText',
  ThemeColor = 'themeColor',
  SidebarVariant = 'sidebarVariant',
  SidebarStyle = 'sidebarStyle',
  LayoutDirection = 'layoutDirection',
  ThemeMode = 'themeMode'
}

export enum ECurrencyFormatFormKey {
  DecimalPlaces = 'decimalPlaces',
  SymbolPosition = 'symbolPosition',
  DecimalSeparator = 'decimalSeparator',
  ThousandsSeparator = 'thousandsSeparator',
  ShowDecimals = 'showDecimals',
  AddSpace = 'addSpace'
}

export enum EEmailSettingsFormKey {
  Host = 'host',
  Port = 'port',
  Username = 'username',
  Password = 'password',
  Encryption = 'encryption',
  FromAddress = 'fromAddress',
  FromName = 'fromName',
  TestTo = 'testTo'
}

export enum EBankTransferFormKey {
  Enabled = 'enabled',
  BankName = 'bankName',
  AccountNumber = 'accountNumber',
  AccountName = 'accountName',
  Details = 'details'
}

export enum EStorageSettingsFormKey {
  AllowedFileTypes = 'allowedFileTypes',
  MaxUploadSizeKb = 'maxUploadSizeKb'
}

export enum EEmailTemplateSettingsFormKey {
  FromName = 'fromName'
}

export enum EEmailTemplateContentFormKey {
  Subject = 'subject',
  Content = 'content'
}

export enum ESeoSettingsFormKey {
  MetaKeywords = 'metaKeywords',
  MetaDescription = 'metaDescription',
  MetaImageUrl = 'metaImageUrl'
}

export enum ERecaptchaSettingsFormKey {
  Enabled = 'enabled',
  Version = 'version',
  SiteKey = 'siteKey',
  Secret = 'secret'
}

export enum ECookieSettingsFormKey {
  EnableLogging = 'enableLogging',
  CookieTitle = 'cookieTitle',
  CookieDescription = 'cookieDescription',
  StrictlyTitle = 'strictlyTitle',
  StrictlyDescription = 'strictlyDescription',
  ContactDescription = 'contactDescription',
  ContactUrl = 'contactUrl'
}

export enum EEmployeeFilterFormKey {
  Keyword = 'keyword',
  BranchId = 'branchId',
  DepartmentId = 'departmentId',
  DesignationId = 'designationId'
}

export enum EEmployeeFormKey {
  FullName = 'fullName',
  DateOfBirth = 'dateOfBirth',
  Gender = 'gender',
  Phone = 'phone',
  ProfileImage = 'profileImage',
  AddressLine1 = 'addressLine1',
  AddressLine2 = 'addressLine2',
  City = 'city',
  State = 'state',
  Country = 'country',
  PostalCode = 'postalCode',
  EmergencyName = 'emergencyName',
  EmergencyRelationship = 'emergencyRelationship',
  EmergencyPhone = 'emergencyPhone',
  EmployeeCode = 'employeeCode',
  BranchId = 'branchId',
  DepartmentId = 'departmentId',
  DesignationId = 'designationId',
  DateOfJoining = 'dateOfJoining',
  EmploymentType = 'employmentType',
  Status = 'status',
  ReportsToId = 'reportsToId',
  BankName = 'bankName',
  AccountHolderName = 'accountHolderName',
  AccountNumber = 'accountNumber',
  BankIdentifierCode = 'bankIdentifierCode',
  BankBranch = 'bankBranch',
  TaxPayerId = 'taxPayerId',
  BaseSalary = 'baseSalary',
  Email = 'email',
  Password = 'password',
  Documents = 'documents'
}

export enum EEmployeeDocumentFormKey {
  DocumentTypeId = 'documentTypeId',
  File = 'file',
  ExpiryDate = 'expiryDate'
}

export enum EEmployeePasswordFormKey {
  NewPassword = 'newPassword',
  ConfirmPassword = 'confirmPassword'
}

export enum EBranchFormKey {
  Name = 'name',
  Address = 'address',
  City = 'city',
  State = 'state',
  Country = 'country',
  PostalCode = 'postalCode',
  Phone = 'phone',
  Email = 'email',
  Active = 'active'
}

export enum EDepartmentFormKey {
  Name = 'name',
  BranchId = 'branchId',
  Description = 'description',
  Active = 'active'
}

export enum EDepartmentFilterFormKey {
  Keyword = 'keyword',
  BranchId = 'branchId'
}

export enum EDesignationFormKey {
  Name = 'name',
  DepartmentId = 'departmentId',
  Description = 'description',
  Active = 'active'
}

export enum EDesignationFilterFormKey {
  Keyword = 'keyword',
  DepartmentId = 'departmentId'
}

export enum EHolidayFormKey {
  Name = 'name',
  CategoryId = 'categoryId',
  StartDate = 'startDate',
  EndDate = 'endDate',
  Description = 'description',
  BranchIds = 'branchIds'
}

export enum EHolidayFilterFormKey {
  Keyword = 'keyword',
  CategoryId = 'categoryId',
  Year = 'year',
  DateFrom = 'dateFrom',
  DateTo = 'dateTo'
}

export enum EAnnouncementFormKey {
  Title = 'title',
  CategoryId = 'categoryId',
  ShortDescription = 'shortDescription',
  Content = 'content',
  StartDate = 'startDate',
  EndDate = 'endDate',
  Files = 'files',
  Featured = 'featured',
  HighPriority = 'highPriority',
  CompanyWide = 'companyWide',
  BranchIds = 'branchIds',
  DepartmentIds = 'departmentIds'
}

export enum EAnnouncementFilterFormKey {
  Keyword = 'keyword',
  CategoryId = 'categoryId',
  BranchId = 'branchId',
  DepartmentId = 'departmentId',
  DateFrom = 'dateFrom',
  DateTo = 'dateTo'
}

export enum EColorCategoryFormKey {
  Name = 'name',
  Color = 'color'
}

export enum EAwardTypeFormKey {
  Name = 'name',
  Description = 'description',
  Icon = 'icon',
  Active = 'active'
}
