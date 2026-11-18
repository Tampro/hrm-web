import type { TFunction } from 'i18next'
import { Building2, Coins, Gift, LayoutDashboard, Package, Settings, TicketPercent } from 'lucide-react'

import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EBillingCycle, ECompanyStatus } from '~/shared/enums/company.enum'
import { ECouponCodeGeneration, ECouponStatusTab, ECouponType } from '~/shared/enums/coupon.enum'
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
import type { IPlan } from '~/shared/models/plan.model'
import type { IPayoutStatusCounts, IReferralDashboard, IReferredSummary } from '~/shared/models/referral.model'
import type { IAdminOrder, ICurrency, ISaasStatusCounts } from '~/shared/models/saas.model'

type TTranslateEnum = (value?: string | null) => string

const unlimited = (t: TFunction, value: number | null | undefined, format: (v: number) => string) =>
  value === null || value === undefined ? t('plan.unlimited') : format(value)

export const DATA = {
  GET_SIDEBAR_ITEMS: (t: TFunction): ISidebarItem[] => [
    { label: t('sidebar.dashboard'), route: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('sidebar.companies'), route: ROUTES.COMPANIES, icon: Building2, superAdminOnly: true },
    { label: t('sidebar.plans'), route: ROUTES.PLANS, icon: Package, superAdminOnly: true },
    { label: t('sidebar.coupons'), route: ROUTES.COUPONS, icon: TicketPercent, superAdminOnly: true },
    { label: t('sidebar.currencies'), route: ROUTES.CURRENCIES, icon: Coins, superAdminOnly: true },
    { label: t('sidebar.referral'), route: ROUTES.REFERRAL, icon: Gift, superAdminOnly: true },
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
