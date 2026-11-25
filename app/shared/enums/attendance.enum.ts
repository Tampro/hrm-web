// Spec: attendance-service EDayStatus — one cell of the attendance calendar. Late, early departure and overtime are
// flags on a PRESENT / HALF_DAY cell, not statuses of their own.
export enum EDayStatus {
  Present = 'PRESENT',
  Absent = 'ABSENT',
  HalfDay = 'HALF_DAY',
  OnLeave = 'ON_LEAVE',
  Holiday = 'HOLIDAY',
  DayOff = 'DAY_OFF',
  Future = 'FUTURE',
  NotAdded = 'NOT_ADDED'
}

// Spec: attendance-service ERegularizationStatus (timesheet entries, regularizations). All = filter tab only:
// `status` is a Java enum param, so ALL is mapped to undefined before sending.
export enum EApprovalStatus {
  All = 'ALL',
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED'
}
