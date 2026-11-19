// @ts-check
// Fake fixtures for the employee tests (design sample data, not real people). Shapes = employee-service EmployeeDtos.

export const COMPANY = { id: '2', code: 'E2ECO', name: 'E2E Company', status: 'ACTIVE' }

export const ROW = {
  id: '142',
  employeeNo: 'NV0142',
  employeeCode: 'MT142',
  fullName: 'Nguyễn Minh Thư',
  email: 'thu.nguyen@e2e.invalid',
  profileImageUrl: null,
  branch: { id: '10', name: 'Trụ sở' },
  department: { id: '20', name: 'Kỹ thuật' },
  designation: { id: '30', name: 'Kỹ sư phần mềm' },
  status: 'ACTIVE',
  employmentType: 'FULL_TIME',
  dateOfJoining: '2024-01-04',
  loginEnabled: true
}

/** every field null: lists and the profile must stay readable */
export const NULL_ROW = {
  id: '999',
  employeeNo: null,
  employeeCode: null,
  fullName: null,
  email: null,
  profileImageUrl: null,
  branch: null,
  department: null,
  designation: null,
  status: null,
  employmentType: null,
  dateOfJoining: null,
  loginEnabled: false
}

export const COUNTS = { all: 7, active: 4, inactive: 1, probation: 2, terminated: 0 }

export const DOCUMENT = {
  id: '501',
  documentType: { id: '1', name: 'Identity Proof' },
  fileId: '77',
  fileName: 'cccd.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 204800,
  viewUrl: 'http://localhost:4173/e2e-view',
  downloadUrl: 'http://localhost:4173/e2e-download',
  expiryDate: '2025-01-01',
  expired: true,
  verified: false,
  verifiedAt: null
}

export const DETAIL = {
  ...ROW,
  companyId: '2',
  phone: '0912345678',
  dateOfBirth: '1997-08-12',
  gender: 'FEMALE',
  profileImageId: '88',
  shiftId: '3',
  attendancePolicyId: null,
  reportsTo: { id: '138', name: 'Trần Quốc Hưng' },
  addressLine1: 'Số 18 ngõ 72',
  addressLine2: null,
  city: 'Hà Nội',
  state: null,
  country: 'Việt Nam',
  postalCode: null,
  emergencyName: 'Nguyễn Văn Bình',
  emergencyRelationship: 'Bố',
  emergencyPhone: '0904118226',
  banking: {
    bankName: 'Vietcombank',
    accountHolderName: 'NGUYEN MINH THU',
    accountNumber: '01234567891',
    bankIdentifierCode: 'BFTVVNVX',
    bankBranch: 'Hà Nội',
    taxPayerId: '8000000000',
    baseSalary: 17000000
  },
  userId: '7001',
  documents: [DOCUMENT],
  createdDate: '2024-01-04T02:00:00Z',
  updatedDate: null
}

export const BRANCHES = [{ id: '10', name: 'Trụ sở' }]
export const DEPARTMENTS = [{ id: '20', name: 'Kỹ thuật', branchId: '10' }]
export const DESIGNATIONS = [{ id: '30', name: 'Kỹ sư phần mềm', departmentId: '20' }]
export const DOCUMENT_TYPES = [
  { id: '1', name: 'Identity Proof', system: true, defaultSlot: true },
  { id: '2', name: 'Address Proof', system: true, defaultSlot: true }
]
