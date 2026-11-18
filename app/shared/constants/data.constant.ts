import type { TFunction } from 'i18next'
import { Building2, LayoutDashboard, Package } from 'lucide-react'

import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EBillingCycle, ECompanyStatus } from '~/shared/enums/company.enum'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import type { IInfoRow, ISidebarItem, ITabItem, ITabOption } from '~/shared/models/common.model'
import type { ICompanyInfo, ICompanyStatusCounts } from '~/shared/models/company.model'
import type { IPlan } from '~/shared/models/plan.model'
import type { IAdminOrder, ICurrency, ISaasStatusCounts } from '~/shared/models/saas.model'

type TTranslateEnum = (value?: string | null) => string

const unlimited = (t: TFunction, value: number | null | undefined, format: (v: number) => string) =>
  value === null || value === undefined ? t('plan.unlimited') : format(value)

export const DATA = {
  GET_SIDEBAR_ITEMS: (t: TFunction): ISidebarItem[] => [
    { label: t('sidebar.dashboard'), route: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('sidebar.companies'), route: ROUTES.COMPANIES, icon: Building2, superAdminOnly: true },
    { label: t('sidebar.plans'), route: ROUTES.PLANS, icon: Package, superAdminOnly: true }
  ],

  // Spec: status-counts {all, active, inactive}; tabs All / Active / Inactive (manual 3.2.1)
  GET_COMPANY_STATUS_TABS: (t: TFunction, counts?: ICompanyStatusCounts): ITabOption<ECompanyStatus>[] => [
    { label: t('company.tab.all'), value: ECompanyStatus.All, count: counts?.all },
    { label: t('company.tab.active'), value: ECompanyStatus.Active, count: counts?.active },
    { label: t('company.tab.inactive'), value: ECompanyStatus.Suspended, count: counts?.inactive }
  ],

  GET_BILLING_CYCLE_OPTIONS: (t: TFunction): ITabOption<EBillingCycle>[] => [
    { label: t('company.upgrade.monthly'), value: EBillingCycle.Monthly },
    { label: t('company.upgrade.yearly'), value: EBillingCycle.Yearly }
  ],

  // Spec: CompanyInfoDto — profile, subscription, account count vs plan limit
  GET_COMPANY_INFO_ROWS: (t: TFunction, info: ICompanyInfo | undefined, translateEnum: TTranslateEnum): IInfoRow[] => {
    const company = info?.company
    const limit = info?.maxUsers === null || info?.maxUsers === undefined ? '∞' : String(info.maxUsers)
    return [
      { label: t('company.field.code'), value: company?.code || '-' },
      { label: t('company.field.name'), value: company?.name || '-' },
      { label: t('company.field.email'), value: company?.email || '-' },
      { label: t('company.field.status'), value: translateEnum(company?.status) },
      { label: t('company.field.plan'), value: company?.planName || '-' },
      { label: t('company.field.subscription'), value: translateEnum(company?.subscriptionStatus) },
      { label: t('company.field.plan_expires_at'), value: dateHelper.formatDate(company?.planExpiresAt) },
      {
        label: t('company.field.users'),
        value: `${commonHelper.formatNumber(info?.userCount ?? null, 0)} / ${limit}`
      },
      { label: t('company.field.created_at'), value: dateHelper.formatDate(company?.createdDate) }
    ]
  },

  // Manual 3.2.3: the Plans section has three sub-sections (separate routes)
  GET_PLAN_SECTION_TABS: (t: TFunction): ITabItem[] => [
    { label: t('plan.section.plans'), route: ROUTES.PLANS },
    { label: t('plan.section.requests'), route: ROUTES.PLAN_REQUESTS },
    { label: t('plan.section.orders'), route: ROUTES.PLAN_ORDERS }
  ],

  // Spec: SaasDtos.StatusCountsDto(all, pending, approved, rejected, cancelled).
  // Manual shows All / Pending / Approved / Rejected; Cancelled is added because the BE has it (Proposal).
  GET_SAAS_STATUS_TABS: (t: TFunction, counts?: ISaasStatusCounts): ITabOption<ESaasRequestStatus>[] => [
    { label: t('saas.tab.all'), value: ESaasRequestStatus.All, count: counts?.all },
    { label: t('saas.tab.pending'), value: ESaasRequestStatus.Pending, count: counts?.pending },
    { label: t('saas.tab.approved'), value: ESaasRequestStatus.Approved, count: counts?.approved },
    { label: t('saas.tab.rejected'), value: ESaasRequestStatus.Rejected, count: counts?.rejected },
    { label: t('saas.tab.cancelled'), value: ESaasRequestStatus.Cancelled, count: counts?.cancelled }
  ],

  // Manual 3.2.3 "What's Included": users, employees, storage; null = unlimited
  GET_PLAN_LIMIT_ROWS: (t: TFunction, plan: IPlan): IInfoRow[] => [
    { label: t('plan.field.max_users'), value: unlimited(t, plan.maxUsers, (v) => commonHelper.formatNumber(v, 0)) },
    {
      label: t('plan.field.max_employees'),
      value: unlimited(t, plan.maxEmployees, (v) => commonHelper.formatNumber(v, 0))
    },
    {
      label: t('plan.field.storage_limit_gb'),
      value: unlimited(t, plan.storageLimitGb, (v) => `${commonHelper.formatNumber(v, 2)} GB`)
    }
  ],

  // Spec: AdminOrderDto + OrderDto
  GET_ORDER_DETAIL_ROWS: (
    t: TFunction,
    detail: IAdminOrder | undefined,
    translateEnum: TTranslateEnum,
    currency?: ICurrency
  ): IInfoRow[] => {
    const order = detail?.order
    return [
      { label: t('order.field.order_number'), value: order?.orderNumber || '-' },
      { label: t('order.field.company'), value: detail?.companyName || '-' },
      { label: t('order.field.company_email'), value: detail?.companyEmail || '-' },
      { label: t('order.field.plan'), value: detail?.planName || '-' },
      { label: t('order.field.billing_cycle'), value: translateEnum(order?.billingCycle) },
      { label: t('order.field.original_price'), value: commonHelper.formatMoney(order?.originalPrice, currency) },
      { label: t('order.field.coupon'), value: order?.couponCode || '-' },
      { label: t('order.field.discount'), value: commonHelper.formatMoney(order?.discountAmount, currency) },
      { label: t('order.field.final_price'), value: commonHelper.formatMoney(order?.finalPrice, currency) },
      { label: t('order.field.payment_method'), value: translateEnum(order?.paymentMethod) },
      { label: t('order.field.payment_reference'), value: order?.paymentReference || '-' },
      { label: t('order.field.status'), value: translateEnum(order?.status) },
      { label: t('order.field.order_date'), value: dateHelper.formatDateTime(order?.createdDate) },
      { label: t('order.field.processed_at'), value: dateHelper.formatDateTime(order?.processedAt) },
      { label: t('order.field.notes'), value: order?.notes || '-' }
    ]
  },

  // Spec: BankTransferDto — what the company was told to transfer
  GET_BANK_TRANSFER_ROWS: (t: TFunction, detail: IAdminOrder | undefined): IInfoRow[] => {
    const bank = detail?.order?.bankTransfer
    return [
      { label: t('order.bank.bank_name'), value: bank?.bankName || '-' },
      { label: t('order.bank.account_number'), value: bank?.accountNumber || '-' },
      { label: t('order.bank.account_name'), value: bank?.accountName || '-' },
      { label: t('order.bank.transfer_content'), value: bank?.transferContent || '-' }
    ]
  }
}
