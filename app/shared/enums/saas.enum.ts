// Spec: OrderDto.status / PlanRequestDto.status (same values). All = filter tab only (team rule)
export enum ESaasRequestStatus {
  All = 'ALL',
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED'
}

// Spec: OrderDto.paymentMethod
export enum EPaymentMethod {
  BankTransfer = 'BANK_TRANSFER',
  Manual = 'MANUAL'
}
