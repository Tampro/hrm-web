import type { TFunction } from 'i18next'
import { Building2, LayoutDashboard } from 'lucide-react'

import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EBillingCycle, ECompanyStatus } from '~/shared/enums/company.enum'
import type { IInfoRow, ISidebarItem, ITabOption } from '~/shared/models/common.model'
import type { ICompanyInfo, ICompanyStatusCounts } from '~/shared/models/company.model'

export const DATA = {
  GET_SIDEBAR_ITEMS: (t: TFunction): ISidebarItem[] => [
    { label: t('sidebar.dashboard'), route: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('sidebar.companies'), route: ROUTES.COMPANIES, icon: Building2, superAdminOnly: true }
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
  GET_COMPANY_INFO_ROWS: (
    t: TFunction,
    info: ICompanyInfo | undefined,
    translateEnum: (value?: string) => string
  ): IInfoRow[] => {
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
  }
}
