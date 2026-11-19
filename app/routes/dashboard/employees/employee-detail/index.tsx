import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { Avatar } from '~/components/customs/avatar-custom'
import { InfoRows } from '~/components/customs/info-rows'
import { TabsCustom } from '~/components/customs/tab-custom'
import { Badge } from '~/components/ui/badge'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'
import { EMPLOYEE_STATUS_BADGE } from '~/helpers/columns/employee-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import { useGetEmployeeDetailApi } from '~/hooks/apis/use-employee-api'
import { useQueryParams } from '~/hooks/use-query-params'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { PageLayout } from '~/layouts/page.layout'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EEmployeeDetailTab } from '~/shared/enums/employee.enum'

import { EmployeeActions } from './components/employee-actions'
import { EmployeeDocuments } from './components/employee-documents'
import { EmployeeLetters } from './components/employee-letters'

export function meta() {
  return [{ title: 'Employee profile · SPECOM HRM' }]
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className='bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5'>
      <h2 className='text-muted-foreground text-sm font-semibold uppercase'>{title}</h2>
      {children}
    </section>
  )
}

// Manual 6.1 View employee, design CmsNhanVienChiTiet (header + tabs). Spec: GET /employees/{id} (documents included)
export default function EmployeeDetailPage() {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { id } = useParams()
  const { data: me } = useMeApi()
  const can = (permission: string) => !!me?.superAdmin || !!me?.permissions?.includes(permission)
  const { searchParams } = useQueryParams()
  const [tab, setTab] = useState(() =>
    commonHelper.toEnumValue(searchParams.get('tab'), Object.values(EEmployeeDetailTab), EEmployeeDetailTab.Overview)
  )
  const { detail: employee, isLoading, isError } = useGetEmployeeDetailApi({ id })
  const backTo =
    me?.superAdmin && employee?.companyId ? `${ROUTES.EMPLOYEES}?companyId=${employee.companyId}` : ROUTES.EMPLOYEES

  return (
    <PageLayout>
      <div className='bg-card flex flex-col gap-4 rounded-xl border p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-4'>
            <Link
              to={backTo}
              className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
              aria-label={t('employee.back_to_list')}
            >
              <ArrowLeft />
            </Link>
            {isLoading ? (
              <Skeleton className='h-14 w-72' />
            ) : (
              <>
                <Avatar name={employee?.fullName} src={employee?.profileImageUrl} size='lg' />
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h1 className='text-xl font-semibold'>{employee?.fullName || '-'}</h1>
                    {employee?.status && (
                      <Badge variant='outline' className={EMPLOYEE_STATUS_BADGE[employee.status] ?? ''}>
                        {getTranslateEnum(employee.status)}
                      </Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {[
                      employee?.employeeNo,
                      [employee?.designation?.name, employee?.department?.name].filter(Boolean).join(', '),
                      employee?.dateOfJoining &&
                        t('employee.joined_on', { date: dateHelper.formatDate(employee.dateOfJoining) })
                    ]
                      .filter(Boolean)
                      .join(' · ') || '-'}
                  </p>
                </div>
              </>
            )}
          </div>
          {employee && (
            <div className='flex gap-2'>
              {can('EMPLOYEE_UPDATE') && (
                <Link
                  to={ROUTES.EMPLOYEE_EDIT(employee.id ?? '')}
                  className={cn(buttonVariants({ className: 'h-[38px]' }))}
                >
                  <Pencil />
                  {t('employee.edit')}
                </Link>
              )}
              {(can('EMPLOYEE_UPDATE') || can('EMPLOYEE_DELETE')) && <EmployeeActions employee={employee} />}
            </div>
          )}
        </div>
        {employee && (
          <TabsCustom
            value={tab}
            onChange={setTab}
            options={DATA.GET_EMPLOYEE_DETAIL_TABS(t, employee.documents?.length)}
          />
        )}
      </div>

      {isError && (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
          {t('employee.not_found')}
        </div>
      )}

      {employee && tab === EEmployeeDetailTab.Overview && (
        <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
          <div className='flex min-w-0 flex-col gap-4'>
            <InfoCard title={t('employee.section.personal')}>
              <InfoRows rows={DATA.GET_EMPLOYEE_PERSONAL_ROWS(t, employee, getTranslateEnum)} />
            </InfoCard>
            <InfoCard title={t('employee.section.work')}>
              <InfoRows rows={DATA.GET_EMPLOYEE_WORK_ROWS(t, employee, getTranslateEnum)} />
            </InfoCard>
          </div>
          <InfoCard title={t('employee.section.banking')}>
            {/* Spec: banking is null without EMPLOYEE_BANKING_VIEW */}
            {employee.banking ? (
              <InfoRows rows={DATA.GET_EMPLOYEE_BANKING_ROWS(t, employee.banking)} />
            ) : (
              <p className='text-muted-foreground text-sm'>
                {can('EMPLOYEE_BANKING_VIEW') ? t('employee.banking_empty') : t('employee.banking_no_access')}
              </p>
            )}
          </InfoCard>
        </div>
      )}
      {employee && tab === EEmployeeDetailTab.Documents && (
        <EmployeeDocuments employee={employee} canUpdate={can('EMPLOYEE_UPDATE')} />
      )}
      {employee && tab === EEmployeeDetailTab.Letters && <EmployeeLetters employee={employee} />}
    </PageLayout>
  )
}
