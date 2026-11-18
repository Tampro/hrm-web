// Spec: ECouponType (hrm-be). All = filter option only (team rule: "All" is an enum member)
export enum ECouponType {
  All = 'ALL',
  Percentage = 'PERCENTAGE',
  Flat = 'FLAT'
}

// Spec: ECouponCodeType — MANUAL (default) needs `code`; AUTO generates an 8-character code on create
export enum ECouponCodeGeneration {
  Manual = 'MANUAL',
  Auto = 'AUTO'
}

// Status tabs (manual 3.2.4: All / Active / Inactive) → API `active` = true / false / omitted
export enum ECouponStatusTab {
  All = 'ALL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}
