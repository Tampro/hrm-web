import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, List, Network, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { CompanyPicker, PickCompanyHint } from '~/components/common/company-picker'
import { Button, buttonVariants } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { commonHelper } from '~/helpers/common.helper'
import { useCompanyScope } from '~/hooks/use-company-scope'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { cn } from '~/lib/utils'
import { EmployeeService } from '~/services/employee.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EOrgChartView } from '~/shared/enums/employee.enum'

import { OrgChartList } from './components/org-chart-list'
import { OrgChartTree } from './components/org-chart-tree'
import { StatusDot } from './components/status-dot'

/** Zoom steps of the visual hierarchy (1 = 100%) */
const ZOOM = { min: 0.5, max: 1.5, step: 0.1 }

export function meta() {
  return [{ title: 'Organization chart · SPECOM HRM' }]
}

// Manual 6.1 Organization Chart. Spec: GET /employees/org-chart — company on top, employees under the person
// they report to (profile.reportsToId); terminated employees are left out. Two views: list and visual hierarchy.
export default function OrgChartPage() {
  const { t } = useTranslation()
  const { companyId, isSuperAdmin, isReady } = useCompanyScope()
  const { searchParams, updateQuery } = useQueryParams()
  const view = commonHelper.toEnumValue(searchParams.get('view'), Object.values(EOrgChartView), EOrgChartView.List)
  const [scale, setScale] = useState(1)
  const { data: chart, isLoading } = useQuery({
    queryKey: [QUERY_KEY.EMPLOYEE.GET_ORG_CHART, companyId],
    queryFn: () => EmployeeService.GetOrgChart({ companyId }),
    select: (res) => res?.data,
    enabled: isReady
  })
  const zoom = (delta: number) =>
    setScale((s) => Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round((s + delta) * 10) / 10)))

  const views = [
    { value: EOrgChartView.List, label: t('employee.org_chart.view_list'), icon: <List /> },
    { value: EOrgChartView.Tree, label: t('employee.org_chart.view_tree'), icon: <Network /> }
  ]

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
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
        {isReady && (
          // two views side by side: the active one is pressed
          <div role='group' aria-label={t('employee.org_chart.view_label')} className='bg-muted flex rounded-lg p-1'>
            {views.map((v) => (
              <Button
                key={v.value}
                variant={view === v.value ? 'default' : 'ghost'}
                className='h-[30px]'
                aria-pressed={view === v.value}
                onClick={() => updateQuery('view', v.value)}
              >
                {v.icon}
                {v.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isSuperAdmin && <CompanyPicker />}

      {!isReady ? (
        isSuperAdmin && <PickCompanyHint />
      ) : isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : (
        <section
          aria-label={t('employee.org_chart.title')}
          className='bg-muted/30 flex flex-col gap-4 rounded-xl border p-5'
        >
          <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
            <div className='flex flex-wrap items-center gap-4'>
              <span className='flex items-center gap-1.5'>
                <StatusDot active />
                {t('employee.org_chart.active')}
              </span>
              <span className='flex items-center gap-1.5'>
                <StatusDot active={false} />
                {t('employee.org_chart.inactive')}
              </span>
            </div>
            {view === EOrgChartView.Tree && (
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('employee.org_chart.zoom_out')}
                  disabled={scale <= ZOOM.min}
                  onClick={() => zoom(-ZOOM.step)}
                >
                  <ZoomOut />
                </Button>
                <span className='w-12 text-center tabular-nums' aria-live='polite'>
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('employee.org_chart.zoom_in')}
                  disabled={scale >= ZOOM.max}
                  onClick={() => zoom(ZOOM.step)}
                >
                  <ZoomIn />
                </Button>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('employee.org_chart.zoom_reset')}
                  onClick={() => setScale(1)}
                >
                  <RotateCcw />
                </Button>
              </div>
            )}
          </div>

          {view === EOrgChartView.Tree ? (
            <OrgChartTree
              companyName={chart?.companyName}
              members={chart?.members}
              nodes={chart?.children ?? []}
              scale={scale}
            />
          ) : (
            <div className='overflow-x-auto'>
              <div className='bg-primary text-primary-foreground mb-4 flex w-72 max-w-full items-center gap-3 rounded-lg p-3'>
                <Building2 className='size-5' />
                <span className='min-w-0'>
                  <span className='block truncate font-semibold'>{chart?.companyName || '-'}</span>
                  <span className='block text-xs opacity-80'>
                    {t('employee.org_chart.members', { count: chart?.members ?? 0 })}
                  </span>
                </span>
              </div>
              <OrgChartList nodes={chart?.children ?? []} />
            </div>
          )}
        </section>
      )}
    </PageLayout>
  )
}
