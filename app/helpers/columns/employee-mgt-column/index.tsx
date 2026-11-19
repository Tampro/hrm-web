import type { TFunction } from 'i18next'
import { Download, Eye, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'

import type { IColumn } from '~/components/customs/table-custom'
import { Avatar } from '~/components/customs/avatar-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import type { TGetTranslateEnumFn } from '~/hooks/use-transfer-enum'
import { EEmployeeStatus } from '~/shared/enums/employee.enum'
import type { IEmployee, IEmployeeDocument } from '~/shared/models/employee.model'

/** Badge colour of an employee status (design: green working, blue probation, grey inactive, red terminated) */
export const EMPLOYEE_STATUS_BADGE: Record<string, string> = {
  [EEmployeeStatus.Active]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [EEmployeeStatus.Probation]: 'bg-blue-50 text-blue-700 border-blue-200',
  [EEmployeeStatus.Inactive]: 'bg-muted text-muted-foreground',
  [EEmployeeStatus.Terminated]: 'bg-red-50 text-red-700 border-red-200'
}

export type TDocumentAction = 'verify' | 'delete'

export const employeeMgtColumn = {
  // Design CmsNhanVien: employee ID, employee (avatar, name, email), department, designation, type, joined, status
  getEmployee: (t: TFunction, getTranslateEnum: TGetTranslateEnumFn): IColumn<IEmployee>[] => [
    {
      id: 'employeeNo',
      header: t('employee.field.employee_no'),
      cell: (row) => <span className='text-muted-foreground font-mono text-sm'>{row.employeeNo || '-'}</span>
    },
    {
      id: 'employee',
      header: t('employee.field.employee'),
      cell: (row) => (
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar name={row.fullName} src={row.profileImageUrl} />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{row.fullName || '-'}</p>
            <p className='text-muted-foreground truncate text-xs'>{row.email || '-'}</p>
          </div>
        </div>
      )
    },
    { id: 'department', header: t('employee.field.department'), cell: (row) => row.department?.name || '-' },
    { id: 'designation', header: t('employee.field.designation'), cell: (row) => row.designation?.name || '-' },
    {
      id: 'employmentType',
      header: t('employee.field.employment_type'),
      cell: (row) => getTranslateEnum(row.employmentType)
    },
    {
      id: 'dateOfJoining',
      header: t('employee.field.date_of_joining'),
      cell: (row) => dateHelper.formatDate(row.dateOfJoining)
    },
    {
      id: 'status',
      header: t('employee.field.status'),
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-1'>
          <Badge variant='outline' className={EMPLOYEE_STATUS_BADGE[row.status ?? ''] ?? ''}>
            {getTranslateEnum(row.status)}
          </Badge>
          {row.loginEnabled === false && (
            <Badge variant='outline' title={t('employee.login_off_hint')}>
              {t('employee.login_off')}
            </Badge>
          )}
        </div>
      )
    }
  ],

  // Documents tab: type, file, size, expiry, verified, actions (view, download, verify, remove)
  getDocument: (
    t: TFunction,
    onAction: (action: TDocumentAction, doc: IEmployeeDocument) => void,
    canUpdate: boolean
  ): IColumn<IEmployeeDocument>[] => [
    { id: 'type', header: t('employee.document.type'), cell: (row) => row.documentType?.name || '-' },
    {
      id: 'file',
      header: t('employee.document.file'),
      cell: (row) => <span className='break-all'>{row.fileName || '-'}</span>
    },
    { id: 'size', header: t('employee.document.size'), cell: (row) => commonHelper.formatFileSize(row.sizeBytes) },
    {
      id: 'expiry',
      header: t('employee.document.expiry_date'),
      cell: (row) => (
        <span className={row.expired ? 'text-destructive font-medium' : undefined}>
          {dateHelper.formatDate(row.expiryDate)}
          {row.expired && ` · ${t('employee.document.expired')}`}
        </span>
      )
    },
    {
      id: 'verified',
      header: t('employee.document.verified'),
      cell: (row) =>
        row.verified ? (
          <Badge className='bg-emerald-50 text-emerald-700' variant='outline'>
            {t('employee.document.verified_yes')}
          </Badge>
        ) : (
          <Badge variant='outline'>{t('employee.document.verified_no')}</Badge>
        )
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{t('common.actions')}</span>,
      className: 'w-44 text-right',
      meta: { disableNavigation: true },
      cell: (row) => (
        <div className='flex justify-end gap-1'>
          {/* time-limited signed links of the media service; opened in a new tab */}
          {row.viewUrl && (
            <a
              href={row.viewUrl}
              target='_blank'
              rel='noreferrer'
              aria-label={t('employee.document.view_named', { name: row.fileName ?? '' })}
              className='hover:bg-muted inline-flex size-8 items-center justify-center rounded-md'
            >
              <Eye className='size-4' />
            </a>
          )}
          {row.downloadUrl && (
            <a
              href={row.downloadUrl}
              aria-label={t('employee.document.download_named', { name: row.fileName ?? '' })}
              className='hover:bg-muted inline-flex size-8 items-center justify-center rounded-md'
            >
              <Download className='size-4' />
            </a>
          )}
          {canUpdate && (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t(row.verified ? 'employee.document.unverify_named' : 'employee.document.verify_named', {
                  name: row.fileName ?? ''
                })}
                onClick={() => onAction('verify', row)}
              >
                {row.verified ? <ShieldOff /> : <ShieldCheck />}
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-destructive'
                aria-label={t('employee.document.remove_named', { name: row.fileName ?? '' })}
                onClick={() => onAction('delete', row)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]
}
