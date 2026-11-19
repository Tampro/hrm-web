import type { TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import { EEmployeeStatus, EEmployeeStep, EEmploymentType } from '~/shared/enums/employee.enum'
import { EEmployeeFormKey } from '~/shared/enums/form.enum'
import type { IEmployeeDetail, IEmployeeProfilePayload } from '~/shared/models/employee.model'

/** '' → undefined (the backend treats omitted as empty); ids are int64 in forms */
const opt = (v: string) => v.trim() || undefined
const optId = (v: string) => (v ? Number(v) : undefined)

/** Fields checked before leaving each wizard step */
export const EMPLOYEE_STEP_FIELDS: Record<EEmployeeStep, EEmployeeFormKey[]> = {
  [EEmployeeStep.Personal]: [
    EEmployeeFormKey.FullName,
    EEmployeeFormKey.DateOfBirth,
    EEmployeeFormKey.Gender,
    EEmployeeFormKey.Phone,
    EEmployeeFormKey.AddressLine1,
    EEmployeeFormKey.AddressLine2,
    EEmployeeFormKey.City,
    EEmployeeFormKey.State,
    EEmployeeFormKey.Country,
    EEmployeeFormKey.PostalCode,
    EEmployeeFormKey.EmergencyName,
    EEmployeeFormKey.EmergencyRelationship,
    EEmployeeFormKey.EmergencyPhone
  ],
  [EEmployeeStep.Work]: [
    EEmployeeFormKey.EmployeeCode,
    EEmployeeFormKey.BranchId,
    EEmployeeFormKey.DepartmentId,
    EEmployeeFormKey.DesignationId,
    EEmployeeFormKey.DateOfJoining,
    EEmployeeFormKey.EmploymentType,
    EEmployeeFormKey.Status,
    EEmployeeFormKey.ReportsToId
  ],
  [EEmployeeStep.Banking]: [
    EEmployeeFormKey.BankName,
    EEmployeeFormKey.AccountHolderName,
    EEmployeeFormKey.AccountNumber,
    EEmployeeFormKey.BankIdentifierCode,
    EEmployeeFormKey.BankBranch,
    EEmployeeFormKey.TaxPayerId,
    EEmployeeFormKey.BaseSalary
  ],
  [EEmployeeStep.Account]: [EEmployeeFormKey.Email, EEmployeeFormKey.Password, EEmployeeFormKey.Documents]
}

export const EMPLOYEE_DEFAULT_VALUES: TEmployeeSchema = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  profileImage: null,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  employeeCode: '',
  branchId: '',
  departmentId: '',
  designationId: '',
  dateOfJoining: '',
  employmentType: EEmploymentType.FullTime,
  status: EEmployeeStatus.Active,
  reportsToId: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  bankIdentifierCode: '',
  bankBranch: '',
  taxPayerId: '',
  baseSalary: '',
  email: '',
  password: '',
  documents: []
}

export const employeeHelper = {
  /** Detail → wizard values (edit); null fields become '' */
  toFormValues: (e: IEmployeeDetail): TEmployeeSchema => ({
    ...EMPLOYEE_DEFAULT_VALUES,
    fullName: e.fullName ?? '',
    dateOfBirth: e.dateOfBirth ?? '',
    gender: e.gender ?? '',
    phone: e.phone ?? '',
    addressLine1: e.addressLine1 ?? '',
    addressLine2: e.addressLine2 ?? '',
    city: e.city ?? '',
    state: e.state ?? '',
    country: e.country ?? '',
    postalCode: e.postalCode ?? '',
    emergencyName: e.emergencyName ?? '',
    emergencyRelationship: e.emergencyRelationship ?? '',
    emergencyPhone: e.emergencyPhone ?? '',
    employeeCode: e.employeeCode ?? '',
    branchId: e.branch?.id ?? '',
    departmentId: e.department?.id ?? '',
    designationId: e.designation?.id ?? '',
    dateOfJoining: e.dateOfJoining ?? '',
    employmentType: e.employmentType ?? EMPLOYEE_DEFAULT_VALUES.employmentType,
    status:
      e.status && e.status !== EEmployeeStatus.All
        ? e.status
        : (EMPLOYEE_DEFAULT_VALUES.status as EEmployeeStatus.Active),
    reportsToId: e.reportsTo?.id ?? '',
    bankName: e.banking?.bankName ?? '',
    accountHolderName: e.banking?.accountHolderName ?? '',
    accountNumber: e.banking?.accountNumber ?? '',
    bankIdentifierCode: e.banking?.bankIdentifierCode ?? '',
    bankBranch: e.banking?.bankBranch ?? '',
    taxPayerId: e.banking?.taxPayerId ?? '',
    baseSalary:
      e.banking?.baseSalary === null || e.banking?.baseSalary === undefined ? '' : String(e.banking.baseSalary)
  }),

  /**
   * Wizard values → ProfileForm. Spec: PUT is a full replacement (omitted = cleared), so values the wizard does not
   * edit (shift, attendance policy) are carried over from `current`.
   */
  toProfilePayload: (
    v: TEmployeeSchema,
    profileImageId: number | undefined,
    current?: IEmployeeDetail
  ): IEmployeeProfilePayload => {
    const banking = {
      bankName: opt(v.bankName),
      accountHolderName: opt(v.accountHolderName),
      accountNumber: opt(v.accountNumber),
      bankIdentifierCode: opt(v.bankIdentifierCode),
      bankBranch: opt(v.bankBranch),
      taxPayerId: opt(v.taxPayerId),
      baseSalary: v.baseSalary ? Number(v.baseSalary) : undefined
    }
    return {
      fullName: v.fullName.trim(),
      employeeCode: opt(v.employeeCode),
      phone: opt(v.phone),
      dateOfBirth: v.dateOfBirth || undefined,
      gender: v.gender || undefined,
      profileImageId,
      branchId: optId(v.branchId),
      departmentId: optId(v.departmentId),
      designationId: optId(v.designationId),
      dateOfJoining: v.dateOfJoining,
      employmentType: v.employmentType,
      status: v.status,
      shiftId: optId(current?.shiftId ?? ''),
      attendancePolicyId: optId(current?.attendancePolicyId ?? ''),
      addressLine1: opt(v.addressLine1),
      addressLine2: opt(v.addressLine2),
      city: opt(v.city),
      state: opt(v.state),
      country: opt(v.country),
      postalCode: opt(v.postalCode),
      emergencyName: opt(v.emergencyName),
      emergencyRelationship: opt(v.emergencyRelationship),
      emergencyPhone: opt(v.emergencyPhone),
      banking: Object.values(banking).some((x) => x !== undefined) ? banking : undefined,
      reportsToId: optId(v.reportsToId)
    }
  }
}
