// Spec: employee-service EEmployeeStatus. All = filter tab only (team rule: "All" is an enum member);
// the list's `status` param is a Java enum, so ALL is mapped to undefined before sending.
export enum EEmployeeStatus {
  All = 'ALL',
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Probation = 'PROBATION',
  Terminated = 'TERMINATED'
}

// Spec: EEmploymentType. TODO(assumption): the backend marks every value but FULL_TIME as unconfirmed by BA.
export enum EEmploymentType {
  FullTime = 'FULL_TIME',
  PartTime = 'PART_TIME',
  Contract = 'CONTRACT',
  Intern = 'INTERN',
  Temporary = 'TEMPORARY'
}

// Spec: EGender
export enum EGender {
  Male = 'MALE',
  Female = 'FEMALE',
  Other = 'OTHER'
}

// Spec: ELetterType — Certifications (PDF letters)
export enum ELetterType {
  JoiningLetter = 'JOINING_LETTER',
  ExperienceCertificate = 'EXPERIENCE_CERTIFICATE',
  Noc = 'NOC'
}

/** Steps of the Add / Edit employee wizard */
export enum EEmployeeStep {
  Personal = 'PERSONAL',
  Work = 'WORK',
  Banking = 'BANKING',
  Account = 'ACCOUNT'
}

/** Tabs of the employee detail page */
export enum EEmployeeDetailTab {
  Overview = 'OVERVIEW',
  Documents = 'DOCUMENTS',
  Letters = 'LETTERS'
}

/** Organization chart layout, kept in ?view= (LIST = indented outline, TREE = visual hierarchy) */
export enum EOrgChartView {
  List = 'LIST',
  Tree = 'TREE'
}
