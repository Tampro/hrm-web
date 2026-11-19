// Spec: employee-service EOrgStatus (branches, departments, designations). All = filter tab only
// (team rule: "All" is an enum member); `status` is a Java enum param, so ALL is mapped to undefined before sending.
export enum EOrgStatus {
  All = 'ALL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}
