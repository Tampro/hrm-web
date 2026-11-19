import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Avatar } from '~/components/customs/avatar-custom'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'
import { useEmployeeCompany } from '~/hooks/apis/use-employee-api'
import { PageLayout } from '~/layouts/page.layout'
import { EmployeeService } from '~/services/employee.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { IOrgChartNode } from '~/shared/models/employee.model'

import { CompanyPicker, PickCompanyHint } from '../components/company-picker'

export function meta() {
  return [{ title: 'Organization chart · SPECOM HRM' }]
}

/** One person and, below, the people who report to them (nested list = the tree's structure for screen readers) */
function ChartNode({ node }: { node: IOrgChartNode }) {
  const { t } = useTranslation()
  return (
    <li className='flex flex-col gap-2'>
      <Link
        to={ROUTES.EMPLOYEE_DETAIL(node.id ?? '')}
        className='bg-card hover:border-primary flex w-72 max-w-full items-center gap-3 rounded-lg border p-3 transition-colors'
      >
        <Avatar name={node.fullName} src={node.profileImageUrl} />
        <span className='min-w-0 flex-1'>
          <span className='block truncate font-medium'>{node.fullName || '-'}</span>
          <span className='text-muted-foreground block truncate text-xs'>{node.designation || '-'}</span>
        </span>
        {/* Spec: green = ACTIVE or PROBATION, red = INACTIVE */}
        <span
          role='img'
          aria-label={t(node.active ? 'employee.org_chart.active' : 'employee.org_chart.inactive')}
          className={`size-2.5 shrink-0 rounded-full ${node.active ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
      </Link>
      {!!node.children?.length && (
        <ul className='border-border ml-6 flex flex-col gap-2 border-l pl-6'>
          {node.children.map((child) => (
            <ChartNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

// Manual 6.1 Organization Chart. Spec: GET /employees/org-chart — company on top, employees under the person
// they report to (profile.reportsToId); terminated employees are left out.
export default function OrgChartPage() {
  const { t } = useTranslation()
  const { companyId, isSuperAdmin, isReady } = useEmployeeCompany()
  const { data: chart, isLoading } = useQuery({
    queryKey: [QUERY_KEY.EMPLOYEE.GET_ORG_CHART, companyId],
    queryFn: () => EmployeeService.GetOrgChart({ companyId }),
    select: (res) => res?.data,
    enabled: isReady
  })

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          to={companyId ? `${ROUTES.EMPLOYEES}?companyId=${companyId}` : ROUTES.EMPLOYEES}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
          aria-label={t('employee.back_to_list')}
        >
          <ArrowLeft />
        </Link>
        <div>
          <h1 className='text-xl font-semibold'>{t('employee.org_chart.title')}</h1>
          <p className='text-muted-foreground text-sm'>{t('employee.org_chart.subtitle')}</p>
        </div>
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint />
      ) : isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : (
        <section
          aria-label={t('employee.org_chart.title')}
          className='bg-muted/30 overflow-x-auto rounded-xl border p-5'
        >
          <div className='bg-primary text-primary-foreground mb-4 flex w-72 max-w-full items-center gap-3 rounded-lg p-3'>
            <Building2 className='size-5' />
            <span className='min-w-0'>
              <span className='block truncate font-semibold'>{chart?.companyName || '-'}</span>
              <span className='block text-xs opacity-80'>
                {t('employee.org_chart.members', { count: chart?.members ?? 0 })}
              </span>
            </span>
          </div>
          {chart?.children?.length ? (
            <ul className='ml-6 flex flex-col gap-2 border-l pl-6'>
              {chart.children.map((node) => (
                <ChartNode key={node.id} node={node} />
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>{t('employee.org_chart.empty')}</p>
          )}
        </section>
      )}
    </PageLayout>
  )
}
