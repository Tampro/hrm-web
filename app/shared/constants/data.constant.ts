import type { TFunction } from 'i18next'
import {
  BadgeCheck,
  Boxes,
  Building2,
  CalendarDays,
  Coins,
  GitBranch,
  Gift,
  LayoutDashboard,
  Megaphone,
  Mail,
  Package,
  Settings,
  TicketPercent,
  Trophy,
  Users
} from 'lucide-react'

import { getHolidayCategoryName } from '~/helpers/columns/holiday-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EBillingCycle, ECompanyStatus } from '~/shared/enums/company.enum'
import { ECouponCodeGeneration, ECouponStatusTab, ECouponType } from '~/shared/enums/coupon.enum'
import {
  EEmployeeDetailTab,
  EEmployeeStatus,
  EEmployeeStep,
  EEmploymentType,
  EGender,
  ELetterType
} from '~/shared/enums/employee.enum'
import { EAnnouncementTab } from '~/shared/enums/announcement.enum'
import { ECalendarMode } from '~/shared/enums/holiday.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import { EPayoutStatus } from '~/shared/enums/referral.enum'
import { ESaasRequestStatus } from '~/shared/enums/saas.enum'
import {
  ELayoutDirection,
  EMailEncryption,
  ENumberSeparator,
  ERecaptchaVersion,
  ESettingsSection,
  ESidebarStyle,
  ESidebarVariant,
  ESymbolPosition,
  EThemeMode,
  EWeekDay
} from '~/shared/enums/settings.enum'
import type { IInfoRow, ISidebarItem, ITabItem, ITabOption } from '~/shared/models/common.model'
import type { ICompanyInfo, ICompanyStatusCounts } from '~/shared/models/company.model'
import type { ICoupon, ICouponStatusCounts } from '~/shared/models/coupon.model'
import type { IEmailTemplatePreview } from '~/shared/models/email-template.model'
import type { IEmployeeBanking, IEmployeeDetail, IEmployeeStatusCounts } from '~/shared/models/employee.model'
import type { IAnnouncement, IAnnouncementStats, IAnnouncementTabCounts } from '~/shared/models/announcement.model'
import type { IHoliday } from '~/shared/models/holiday.model'
import type { IBranch, IDepartment, IDesignation, IOrgStatusCounts } from '~/shared/models/org.model'
import type { IPlan } from '~/shared/models/plan.model'
import type { IPayoutStatusCounts, IReferralDashboard, IReferredSummary } from '~/shared/models/referral.model'
import type { IAdminOrder, ICurrency, ISaasStatusCounts } from '~/shared/models/saas.model'

type TTranslateEnum = (value?: string | null) => string

const unlimited = (t: TFunction, value: number | null | undefined, format: (v: number) => string) =>
  value === null || value === undefined ? t('plan.unlimited') : format(value)

export const DATA = {
  GET_SIDEBAR_ITEMS: (t: TFunction): ISidebarItem[] => [
    { label: t('sidebar.dashboard'), route: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('sidebar.employees'), route: ROUTES.EMPLOYEES, icon: Users, permission: 'EMPLOYEE_VIEW' },
    { label: t('sidebar.branches'), route: ROUTES.BRANCHES, icon: GitBranch, permission: 'ORG_VIEW' },
    { label: t('sidebar.departments'), route: ROUTES.DEPARTMENTS, icon: Boxes, permission: 'ORG_VIEW' },
    { label: t('sidebar.designations'), route: ROUTES.DESIGNATIONS, icon: BadgeCheck, permission: 'ORG_VIEW' },
    { label: t('sidebar.holidays'), route: ROUTES.HOLIDAYS, icon: CalendarDays, permission: 'ORG_VIEW' },
    { label: t('sidebar.award_types'), route: ROUTES.AWARD_TYPES, icon: Trophy, permission: 'ORG_VIEW' },
    {
      label: t('sidebar.announcements'),
      route: ROUTES.ANNOUNCEMENTS,
      icon: Megaphone,
      permission: 'ANNOUNCEMENT_VIEW'
    },
    { label: t('sidebar.companies'), route: ROUTES.COMPANIES, icon: Building2, superAdminOnly: true },
    { label: t('sidebar.plans'), route: ROUTES.PLANS, icon: Package, superAdminOnly: true },
    { label: t('sidebar.coupons'), route: ROUTES.COUPONS, icon: TicketPercent, superAdminOnly: true },
    { label: t('sidebar.currencies'), route: ROUTES.CURRENCIES, icon: Coins, superAdminOnly: true },
    { label: t('sidebar.referral'), route: ROUTES.REFERRAL, icon: Gift, superAdminOnly: true },
    { label: t('sidebar.email_templates'), route: ROUTES.EMAIL_TEMPLATES, icon: Mail, superAdminOnly: true },
    { label: t('sidebar.settings'), route: ROUTES.SETTINGS, icon: Settings, superAdminOnly: true }
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
  },

  // Manual 3.2.4 status tabs All / Active / Inactive. Spec: CouponCountsDto(all, active, inactive)
  GET_COUPON_STATUS_TABS: (t: TFunction, counts?: ICouponStatusCounts): ITabOption<ECouponStatusTab>[] => [
    { label: t('coupon.tab.all'), value: ECouponStatusTab.All, count: counts?.all },
    { label: t('coupon.tab.active'), value: ECouponStatusTab.Active, count: counts?.active },
    { label: t('coupon.tab.inactive'), value: ECouponStatusTab.Inactive, count: counts?.inactive }
  ],

  GET_COUPON_TYPE_OPTIONS: (t: TFunction, withAll = false): ITabOption<ECouponType>[] => [
    ...(withAll ? [{ label: t('coupon.type_all'), value: ECouponType.All }] : []),
    { label: t('enum.PERCENTAGE'), value: ECouponType.Percentage },
    { label: t('enum.FLAT'), value: ECouponType.Flat }
  ],

  GET_COUPON_CODE_GENERATION_OPTIONS: (t: TFunction): ITabOption<ECouponCodeGeneration>[] => [
    { label: t('coupon.form.manual'), value: ECouponCodeGeneration.Manual },
    { label: t('coupon.form.auto'), value: ECouponCodeGeneration.Auto }
  ],

  // Manual 3.2.4 View Details → summary cards: discount, times used (used / limit), user limit, expires
  GET_COUPON_SUMMARY_ROWS: (t: TFunction, coupon: ICoupon | undefined, currency?: ICurrency): IInfoRow[] => [
    { label: t('coupon.field.discount'), value: DATA.FORMAT_COUPON_DISCOUNT(coupon, currency) },
    {
      label: t('coupon.field.times_used'),
      value: `${commonHelper.formatNumber(coupon?.timesUsed ?? null, 0)} / ${unlimited(t, coupon?.useLimitTotal, (v) => commonHelper.formatNumber(v, 0))}`
    },
    {
      label: t('coupon.field.user_limit'),
      value: unlimited(t, coupon?.useLimitPerCompany, (v) => commonHelper.formatNumber(v, 0))
    },
    {
      label: t('coupon.field.expiry_date'),
      value: coupon?.expiryDate ? dateHelper.formatDate(coupon.expiryDate) : t('coupon.no_expiry')
    }
  ],

  // Manual 3.2.4 View Details → coupon information: code, type, min / max spend
  GET_COUPON_INFO_ROWS: (
    t: TFunction,
    coupon: ICoupon | undefined,
    translateEnum: TTranslateEnum,
    currency?: ICurrency
  ): IInfoRow[] => [
    { label: t('coupon.field.code'), value: coupon?.code || '-' },
    { label: t('coupon.field.code_generation'), value: translateEnum(coupon?.codeGeneration) },
    { label: t('coupon.field.type'), value: translateEnum(coupon?.type) },
    { label: t('coupon.field.minimum_spend'), value: DATA.FORMAT_OPTIONAL_MONEY(t, coupon?.minimumSpend, currency) },
    { label: t('coupon.field.maximum_spend'), value: DATA.FORMAT_OPTIONAL_MONEY(t, coupon?.maximumSpend, currency) },
    { label: t('coupon.field.created_at'), value: dateHelper.formatDate(coupon?.createdDate) }
  ],

  /** PERCENTAGE → 20 %, FLAT → money in the default currency */
  FORMAT_COUPON_DISCOUNT: (coupon: ICoupon | undefined, currency?: ICurrency) =>
    coupon?.type === ECouponType.Percentage
      ? commonHelper.formatPercent(coupon?.discountValue)
      : commonHelper.formatMoney(coupon?.discountValue, currency),

  /** Spend bounds: null = no bound */
  FORMAT_OPTIONAL_MONEY: (t: TFunction, value: number | null | undefined, currency?: ICurrency) =>
    value === null || value === undefined ? t('coupon.no_limit') : commonHelper.formatMoney(value, currency),

  // Manual 3.2.5 View: currency information. Spec: CurrencyDto
  // Spec: StatusCounts {all, active, inactive, probation, terminated}; tabs of the Employees page (manual 6.1)
  GET_EMPLOYEE_STATUS_TABS: (t: TFunction, counts?: IEmployeeStatusCounts): ITabOption<EEmployeeStatus>[] => [
    { label: t('employee.tab.all'), value: EEmployeeStatus.All, count: counts?.all },
    { label: t('enum.ACTIVE'), value: EEmployeeStatus.Active, count: counts?.active },
    { label: t('enum.INACTIVE'), value: EEmployeeStatus.Inactive, count: counts?.inactive },
    { label: t('enum.PROBATION'), value: EEmployeeStatus.Probation, count: counts?.probation },
    { label: t('enum.TERMINATED'), value: EEmployeeStatus.Terminated, count: counts?.terminated }
  ],

  /** Status of one employee (no "All") */
  GET_EMPLOYEE_STATUS_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EEmployeeStatus)
      .filter((v) => v !== EEmployeeStatus.All)
      .map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_EMPLOYMENT_TYPE_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EEmploymentType).map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_GENDER_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EGender).map((v) => ({ label: t(`enum.${v}`), value: v })),

  /** Steps of the Add employee wizard (design: 4 steps); Edit has no account step */
  GET_EMPLOYEE_STEPS: (t: TFunction, isCreate: boolean): ITabOption<EEmployeeStep>[] => [
    { label: t('employee.step.personal'), value: EEmployeeStep.Personal },
    { label: t('employee.step.work'), value: EEmployeeStep.Work },
    { label: t('employee.step.banking'), value: EEmployeeStep.Banking },
    ...(isCreate ? [{ label: t('employee.step.account'), value: EEmployeeStep.Account }] : [])
  ],

  GET_EMPLOYEE_DETAIL_TABS: (t: TFunction, documentCount?: number): ITabOption<EEmployeeDetailTab>[] => [
    { label: t('employee.detail_tab.overview'), value: EEmployeeDetailTab.Overview },
    { label: t('employee.detail_tab.documents'), value: EEmployeeDetailTab.Documents, count: documentCount },
    { label: t('employee.detail_tab.letters'), value: EEmployeeDetailTab.Letters }
  ],

  // Spec: ELetterType; PDF in vi (default) or en, ko is served in en
  GET_LETTER_OPTIONS: (t: TFunction): ITabOption<ELetterType>[] =>
    Object.values(ELetterType).map((v) => ({ label: t(`employee.letter.${v}`), value: v })),

  GET_EMPLOYEE_PERSONAL_ROWS: (
    t: TFunction,
    e: IEmployeeDetail | undefined,
    translateEnum: TTranslateEnum
  ): IInfoRow[] => [
    { label: t('employee.field.date_of_birth'), value: dateHelper.formatDate(e?.dateOfBirth) },
    { label: t('employee.field.gender'), value: translateEnum(e?.gender) },
    { label: t('employee.field.phone'), value: e?.phone || '-' },
    { label: t('employee.field.email'), value: e?.email || '-' },
    {
      label: t('employee.field.address'),
      value:
        [e?.addressLine1, e?.addressLine2, e?.city, e?.state, e?.postalCode, e?.country].filter(Boolean).join(', ') ||
        '-'
    },
    {
      label: t('employee.field.emergency'),
      value:
        [e?.emergencyName, e?.emergencyRelationship && `(${e.emergencyRelationship})`, e?.emergencyPhone]
          .filter(Boolean)
          .join(' ') || '-'
    }
  ],

  GET_EMPLOYEE_WORK_ROWS: (t: TFunction, e: IEmployeeDetail | undefined, translateEnum: TTranslateEnum): IInfoRow[] => [
    { label: t('employee.field.employee_no'), value: e?.employeeNo || '-' },
    { label: t('employee.field.employee_code'), value: e?.employeeCode || '-' },
    { label: t('employee.field.branch'), value: e?.branch?.name || '-' },
    { label: t('employee.field.department'), value: e?.department?.name || '-' },
    { label: t('employee.field.designation'), value: e?.designation?.name || '-' },
    { label: t('employee.field.reports_to'), value: e?.reportsTo?.name || '-' },
    { label: t('employee.field.date_of_joining'), value: dateHelper.formatDate(e?.dateOfJoining) },
    { label: t('employee.field.employment_type'), value: translateEnum(e?.employmentType) },
    { label: t('employee.field.login'), value: t(e?.loginEnabled ? 'employee.login_on' : 'employee.login_off') }
  ],

  /** Spec: banking is null without EMPLOYEE_BANKING_VIEW — the card then shows a "no access" note instead */
  GET_EMPLOYEE_BANKING_ROWS: (t: TFunction, b: IEmployeeBanking | null | undefined): IInfoRow[] => [
    { label: t('employee.field.bank_name'), value: b?.bankName || '-' },
    { label: t('employee.field.account_holder_name'), value: b?.accountHolderName || '-' },
    { label: t('employee.field.account_number'), value: b?.accountNumber || '-' },
    { label: t('employee.field.bank_identifier_code'), value: b?.bankIdentifierCode || '-' },
    { label: t('employee.field.bank_branch'), value: b?.bankBranch || '-' },
    { label: t('employee.field.tax_payer_id'), value: b?.taxPayerId || '-' },
    { label: t('employee.field.base_salary'), value: commonHelper.formatMoney(b?.baseSalary) }
  ],

  // Spec: list filter status ACTIVE | INACTIVE (omitted = all); no status-counts endpoint for branches
  /** Status filter of award types (manual: a single "All Statuses" dropdown) */
  GET_ORG_STATUS_OPTIONS: (t: TFunction): ITabOption<EOrgStatus>[] => [
    { label: t('award_type.all_statuses'), value: EOrgStatus.All },
    { label: t('enum.ACTIVE'), value: EOrgStatus.Active },
    { label: t('enum.INACTIVE'), value: EOrgStatus.Inactive }
  ],

  // departments pass the counts of GET /org/departments/status-counts {all, active, inactive}
  GET_ORG_STATUS_TABS: (t: TFunction, counts?: IOrgStatusCounts): ITabOption<EOrgStatus>[] => [
    { label: t('employee.tab.all'), value: EOrgStatus.All, count: counts?.all },
    { label: t('enum.ACTIVE'), value: EOrgStatus.Active, count: counts?.active },
    { label: t('enum.INACTIVE'), value: EOrgStatus.Inactive, count: counts?.inactive }
  ],

  // Spec: TabCounts {all, highPriority, featured, upcoming} — the dashboard tabs (manual 6.3.5)
  GET_ANNOUNCEMENT_TABS: (t: TFunction, counts?: IAnnouncementTabCounts): ITabOption<EAnnouncementTab>[] => [
    { label: t('announcement.tab.all'), value: EAnnouncementTab.All, count: counts?.all },
    { label: t('announcement.tab.high_priority'), value: EAnnouncementTab.HighPriority, count: counts?.highPriority },
    { label: t('announcement.tab.featured'), value: EAnnouncementTab.Featured, count: counts?.featured },
    { label: t('announcement.tab.upcoming'), value: EAnnouncementTab.Upcoming, count: counts?.upcoming }
  ],

  // Statistics page cards (manual: Total Employees, Views, View Rate)
  GET_ANNOUNCEMENT_STAT_CARDS: (t: TFunction, stats: IAnnouncementStats | null | undefined): IInfoRow[] => [
    { label: t('announcement.stats.total_employees'), value: commonHelper.formatNumber(stats?.totalEmployees, 0) },
    { label: t('announcement.stats.views'), value: commonHelper.formatNumber(stats?.views, 0) },
    { label: t('announcement.stats.view_rate'), value: commonHelper.formatPercent(stats?.viewRate) }
  ],

  // Statistics page summary (manual: title, category, target branch / department, start / end date)
  GET_ANNOUNCEMENT_SUMMARY_ROWS: (t: TFunction, a: IAnnouncement | undefined, categoryName: string): IInfoRow[] => [
    { label: t('announcement.field.title'), value: a?.title || '-' },
    { label: t('announcement.field.category'), value: categoryName },
    {
      label: t('announcement.field.branches'),
      value: a?.companyWide ? t('announcement.company_wide') : (a?.branches ?? []).map((b) => b.name).join(', ') || '-'
    },
    {
      label: t('announcement.field.departments'),
      value: a?.companyWide
        ? t('announcement.company_wide')
        : (a?.departments ?? []).map((d) => d.name).join(', ') || '-'
    },
    { label: t('announcement.field.start_date'), value: dateHelper.formatDate(a?.startDate) },
    { label: t('announcement.field.end_date'), value: dateHelper.formatDate(a?.endDate) }
  ],

  // Spec: HolidayDto — allBranches = every branch, also ones created later
  GET_HOLIDAY_DETAIL_ROWS: (t: TFunction, h: IHoliday | undefined): IInfoRow[] => [
    { label: t('holiday.field.name'), value: h?.name || '-' },
    { label: t('holiday.field.category'), value: getHolidayCategoryName(t, h?.category) },
    { label: t('holiday.field.date'), value: dateHelper.formatDateRange(h?.startDate, h?.endDate) },
    { label: t('holiday.field.days'), value: commonHelper.formatNumber(h?.days, 0) },
    {
      label: t('holiday.field.branches'),
      value: h?.allBranches ? t('holiday.all_branches') : (h?.branches ?? []).map((b) => b.name).join(', ') || '-'
    },
    { label: t('holiday.field.description'), value: h?.description || '-' },
    { label: t('holiday.field.created_at'), value: dateHelper.formatDateTime(h?.createdDate) },
    { label: t('holiday.field.updated_at'), value: dateHelper.formatDateTime(h?.updatedDate) }
  ],

  /** Year filter: the current year ± 2 (Spec: `year` filters by the start date) */
  GET_HOLIDAY_YEAR_OPTIONS: (t: TFunction, now = new Date().getFullYear()): ITabOption[] => [
    { label: t('employee.filter.all'), value: '' },
    ...[now - 2, now - 1, now, now + 1, now + 2].map((y) => ({ label: String(y), value: String(y) }))
  ],

  GET_CALENDAR_MODE_TABS: (t: TFunction): ITabOption<ECalendarMode>[] => [
    { label: t('holiday.calendar.month'), value: ECalendarMode.Month },
    { label: t('holiday.calendar.week'), value: ECalendarMode.Week },
    { label: t('holiday.calendar.day'), value: ECalendarMode.Day }
  ],

  // Spec: DesignationDto — employeeCount is filled only by GET /org/designations/{id}
  GET_DESIGNATION_DETAIL_ROWS: (
    t: TFunction,
    d: IDesignation | undefined,
    translateEnum: TTranslateEnum
  ): IInfoRow[] => [
    { label: t('designation.field.name'), value: d?.name || '-' },
    { label: t('designation.field.status'), value: translateEnum(d?.status) },
    { label: t('designation.field.department'), value: d?.department?.name || '-' },
    { label: t('designation.field.branch'), value: d?.branch?.name || '-' },
    { label: t('designation.field.description'), value: d?.description || '-' },
    { label: t('designation.field.employee_count'), value: commonHelper.formatNumber(d?.employeeCount, 0) },
    { label: t('designation.field.created_at'), value: dateHelper.formatDateTime(d?.createdDate) },
    { label: t('designation.field.updated_at'), value: dateHelper.formatDateTime(d?.updatedDate) }
  ],

  // Spec: DepartmentDto — the counts are filled only by GET /org/departments/{id}
  GET_DEPARTMENT_DETAIL_ROWS: (t: TFunction, d: IDepartment | undefined): IInfoRow[] => [
    { label: t('department.field.branch'), value: d?.branch?.name || '-' },
    { label: t('department.field.designation_count'), value: commonHelper.formatNumber(d?.designationCount, 0) },
    { label: t('department.field.employee_count'), value: commonHelper.formatNumber(d?.employeeCount, 0) },
    { label: t('department.field.created_at'), value: dateHelper.formatDate(d?.createdDate) },
    { label: t('department.field.updated_at'), value: dateHelper.formatDateTime(d?.updatedDate) }
  ],

  // Spec: BranchDto — the counts are filled only by GET /org/branches/{id}
  GET_BRANCH_DETAIL_ROWS: (t: TFunction, b: IBranch | undefined, translateEnum: TTranslateEnum): IInfoRow[] => [
    { label: t('branch.field.name'), value: b?.name || '-' },
    { label: t('branch.field.status'), value: translateEnum(b?.status) },
    { label: t('branch.field.address'), value: b?.address || '-' },
    { label: t('branch.field.city'), value: b?.city || '-' },
    { label: t('branch.field.state'), value: b?.state || '-' },
    { label: t('branch.field.country'), value: b?.country || '-' },
    { label: t('branch.field.postal_code'), value: b?.postalCode || '-' },
    { label: t('branch.field.phone'), value: b?.phone || '-' },
    { label: t('branch.field.email'), value: b?.email || '-' },
    { label: t('branch.field.department_count'), value: commonHelper.formatNumber(b?.departmentCount, 0) },
    { label: t('branch.field.employee_count'), value: commonHelper.formatNumber(b?.employeeCount, 0) },
    { label: t('branch.field.created_at'), value: dateHelper.formatDateTime(b?.createdDate) },
    { label: t('branch.field.updated_at'), value: dateHelper.formatDateTime(b?.updatedDate) }
  ],

  // Spec: Rendered {fromName, subject, html} of the email template preview
  GET_EMAIL_PREVIEW_ROWS: (t: TFunction, preview: IEmailTemplatePreview | undefined): IInfoRow[] => [
    { label: t('email_template.field.from_name'), value: preview?.fromName || '-' },
    { label: t('email_template.field.subject'), value: preview?.subject || '-' }
  ],

  GET_CURRENCY_DETAIL_ROWS: (t: TFunction, currency: ICurrency | undefined): IInfoRow[] => [
    { label: t('currency.field.name'), value: currency?.name || '-' },
    { label: t('currency.field.code'), value: currency?.code || '-' },
    { label: t('currency.field.symbol'), value: currency?.symbol || '-' },
    { label: t('currency.field.description'), value: currency?.description || '-' },
    { label: t('currency.field.default'), value: t(currency?.defaultCurrency ? 'common.yes' : 'common.no') },
    { label: t('currency.field.created_at'), value: dateHelper.formatDateTime(currency?.createdDate) },
    { label: t('currency.field.updated_at'), value: dateHelper.formatDateTime(currency?.updatedDate) }
  ],

  // Referral section: four sub-pages (separate routes)
  GET_REFERRAL_SECTION_TABS: (t: TFunction): ITabItem[] => [
    { label: t('referral.section.dashboard'), route: ROUTES.REFERRAL },
    { label: t('referral.section.referred'), route: ROUTES.REFERRAL_REFERRED },
    { label: t('referral.section.payouts'), route: ROUTES.REFERRAL_PAYOUTS },
    { label: t('referral.section.settings'), route: ROUTES.REFERRAL_SETTINGS }
  ],

  // Spec: PayoutCountsDto(all, pending, approved, rejected)
  GET_PAYOUT_STATUS_TABS: (t: TFunction, counts?: IPayoutStatusCounts): ITabOption<EPayoutStatus>[] => [
    { label: t('saas.tab.all'), value: EPayoutStatus.All, count: counts?.all },
    { label: t('saas.tab.pending'), value: EPayoutStatus.Pending, count: counts?.pending },
    { label: t('saas.tab.approved'), value: EPayoutStatus.Approved, count: counts?.approved },
    { label: t('saas.tab.rejected'), value: EPayoutStatus.Rejected, count: counts?.rejected }
  ],

  // Spec: DashboardDto — the four summary cards
  GET_REFERRAL_DASHBOARD_CARDS: (t: TFunction, dashboard?: IReferralDashboard, currency?: ICurrency): IInfoRow[] => [
    {
      label: t('referral.dashboard.total_referred'),
      value: commonHelper.formatNumber(dashboard?.totalReferredCompanies ?? null, 0)
    },
    {
      label: t('referral.dashboard.pending_payouts'),
      value: commonHelper.formatMoney(dashboard?.pendingPayouts, currency)
    },
    {
      label: t('referral.dashboard.total_paid'),
      value: commonHelper.formatMoney(dashboard?.totalCommissionPaid, currency)
    },
    {
      label: t('referral.dashboard.active_companies'),
      value: commonHelper.formatNumber(dashboard?.activeReferredCompanies ?? null, 0)
    }
  ],

  // Spec: DashboardDto — this year's figures
  GET_REFERRAL_YEAR_ROWS: (t: TFunction, dashboard?: IReferralDashboard, currency?: ICurrency): IInfoRow[] => [
    {
      label: t('referral.dashboard.signups_this_year'),
      value: commonHelper.formatNumber(dashboard?.referralSignupsThisYear ?? null, 0)
    },
    {
      label: t('referral.dashboard.payouts_this_year'),
      value: commonHelper.formatMoney(dashboard?.payoutsProcessedThisYear, currency)
    }
  ],

  // Spec: ReferredSummaryDto — the three summary cards
  GET_REFERRED_SUMMARY_CARDS: (t: TFunction, summary?: IReferredSummary, currency?: ICurrency): IInfoRow[] => [
    { label: t('referral.referred.total'), value: commonHelper.formatNumber(summary?.totalReferred ?? null, 0) },
    { label: t('referral.referred.with_plans'), value: commonHelper.formatNumber(summary?.withPlans ?? null, 0) },
    {
      label: t('referral.referred.total_commission'),
      value: commonHelper.formatMoney(summary?.totalCommission, currency)
    }
  ],

  // Settings menu: only sections with a backend API
  GET_SETTINGS_SECTIONS: (t: TFunction): ITabItem[] =>
    Object.values(ESettingsSection).map((section) => ({
      label: t(`settings.section.${section}`),
      route: ROUTES.SETTINGS_SECTION(section)
    })),

  // Spec: SystemSettings patterns
  GET_LANGUAGE_OPTIONS: (t: TFunction): ITabOption[] => [
    { label: t('settings.language.vi'), value: 'vi' },
    { label: t('settings.language.en'), value: 'en' },
    { label: t('settings.language.ko'), value: 'ko' }
  ],

  /** Java patterns sent to the BE (Spec: SystemSettings.dateFormat) */
  GET_DATE_FORMAT_OPTIONS: (): ITabOption[] =>
    ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd.MM.yyyy'].map((value) => ({ label: value, value })),

  GET_TIME_FORMAT_OPTIONS: (t: TFunction): ITabOption[] => [
    { label: `HH:mm (${t('settings.system.time_24h')})`, value: 'HH:mm' },
    { label: `hh:mm a (${t('settings.system.time_12h')})`, value: 'hh:mm a' },
    { label: `HH:mm:ss (${t('settings.system.time_24h_seconds')})`, value: 'HH:mm:ss' }
  ],

  GET_WEEK_DAY_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EWeekDay).map((day) => ({ label: t(`enum.${day}`), value: day })),

  /** IANA zones from the browser (Spec: SETTINGS_001 when the BE does not know the zone) */
  GET_TIMEZONE_OPTIONS: (current?: string): ITabOption[] => {
    const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
    const all = current && !zones.includes(current) ? [current, ...zones] : zones
    return all.map((zone) => ({ label: zone, value: zone }))
  },

  // Spec: BrandSettings.themeColor presets
  GET_THEME_COLOR_OPTIONS: (t: TFunction): ITabOption[] =>
    ['blue', 'green', 'purple', 'orange', 'red', 'teal'].map((color) => ({
      label: t(`settings.brand.color.${color}`),
      value: color
    })),

  GET_SIDEBAR_VARIANT_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(ESidebarVariant).map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_SIDEBAR_STYLE_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(ESidebarStyle).map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_LAYOUT_DIRECTION_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(ELayoutDirection).map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_THEME_MODE_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EThemeMode).map((v) => ({ label: t(`enum.${v}`), value: v })),

  // Spec: CurrencyFormatSettings
  GET_DECIMAL_PLACES_OPTIONS: (): ITabOption[] => [0, 1, 2, 3, 4].map((n) => ({ label: String(n), value: String(n) })),

  GET_SYMBOL_POSITION_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(ESymbolPosition).map((v) => ({ label: t(`enum.${v}`), value: v })),

  GET_SEPARATOR_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(ENumberSeparator).map((v) => ({ label: t(`settings.currency.separator.${v}`), value: v })),

  // Spec: EmailSettingsForm.encryption, RecaptchaSettingsForm.version
  GET_MAIL_ENCRYPTION_OPTIONS: (t: TFunction): ITabOption[] =>
    Object.values(EMailEncryption).map((v) => ({ label: t(`settings.email.encryption_option.${v}`), value: v })),

  GET_RECAPTCHA_VERSION_OPTIONS: (): ITabOption[] => [
    { label: 'reCAPTCHA v2', value: ERecaptchaVersion.V2 },
    { label: 'reCAPTCHA v3', value: ERecaptchaVersion.V3 }
  ]
}
