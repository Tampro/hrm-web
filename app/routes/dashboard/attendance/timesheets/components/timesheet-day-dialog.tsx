import { Check, Eye, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { commonHelper } from '~/helpers/common.helper'
import { dateHelper } from '~/helpers/date.helper'
import { useInvalidateAttendance, useTimesheetDayApi } from '~/hooks/apis/use-attendance-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { TimesheetService } from '~/services/attendance.service'
import { APPROVAL_STATUS_BADGE } from '~/shared/constants/data.constant'
import { EApprovalStatus } from '~/shared/enums/attendance.enum'
import type { ITimesheetEntry } from '~/shared/models/attendance.model'

export interface ITimesheetDay {
  employeeId?: string
  fullName?: string | null
  date?: string
}

type TDecision = 'approve' | 'reject'

interface IProps {
  /** `undefined` = closed */
  day: ITimesheetDay | undefined
  canManage: boolean
  onView: (entry: ITimesheetEntry) => void
  onEdit: (entry: ITimesheetEntry) => void
  onClose: () => void
}

// Manual 6.4.2 "View All": every entry of one employee on one day, with view / edit / approve / reject / delete.
// Spec: GET /timesheets/entries?employeeId&date, PUT …/approve, PUT …/reject, DELETE …/{id}
export function TimesheetDayDialog({ day: prop, canManage, onView, onEdit, onClose }: IProps) {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const invalidate = useInvalidateAttendance()
  const day = useLastDefined(prop)
  const { data: entries = [], isLoading } = useTimesheetDayApi({ employeeId: prop?.employeeId, date: prop?.date })
  const [deleting, setDeleting] = useState<ITimesheetEntry | undefined>()

  const {
    mutate: decide,
    variables: deciding,
    isPending: isDeciding
  } = useMutationApi({
    mutationFn: ({ entry, decision }: { entry: ITimesheetEntry; decision: TDecision }) =>
      decision === 'approve' ? TimesheetService.Approve(entry.id ?? '') : TimesheetService.Reject(entry.id ?? ''),
    onSuccess: async (_, { decision }) => {
      toast.success(t(decision === 'approve' ? 'timesheet.toast.approved' : 'timesheet.toast.rejected'))
      await invalidate()
    }
  })

  const { mutate: remove, isPending: isDeleting } = useMutationApi({
    mutationFn: (entry: ITimesheetEntry) => TimesheetService.Delete(entry.id ?? ''),
    onSuccess: async () => {
      toast.success(t('timesheet.toast.deleted'))
      setDeleting(undefined)
      await invalidate()
    }
  })

  const total = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0)

  const icon = (
    label: string,
    node: React.ReactNode,
    onClick: () => void,
    opts: { className?: string; disabled?: boolean } = {}
  ) => (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={label}
      className={opts.className}
      disabled={opts.disabled}
      onClick={onClick}
    >
      {node}
    </Button>
  )

  return (
    <>
      <Dialog open={prop !== undefined} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {t('timesheet.day.title', { name: day?.fullName ?? '-', date: dateHelper.formatDate(day?.date) })}
            </DialogTitle>
            <DialogDescription>
              {t('timesheet.day.summary', {
                count: entries.length,
                hours: commonHelper.formatNumber(total, 2)
              })}
            </DialogDescription>
          </DialogHeader>
          <ul className='-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1'>
            {isLoading
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className='h-16 w-full' />)
              : entries.map((entry) => {
                  const pending = entry.status === EApprovalStatus.Pending
                  const busy = isDeciding && deciding?.entry.id === entry.id
                  const name = entry.project || t('timesheet.no_project')
                  return (
                    <li key={entry.id} className='flex items-start gap-3 rounded-lg border p-3'>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-semibold'>
                            {t('attendance.hours', { value: commonHelper.formatNumber(entry.hours, 2) })}
                          </span>
                          <Badge
                            variant='outline'
                            className={APPROVAL_STATUS_BADGE[entry.status ?? EApprovalStatus.Pending]}
                          >
                            {getTranslateEnum(entry.status)}
                          </Badge>
                          <span className='truncate font-medium'>{name}</span>
                        </div>
                        <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>{entry.description || '-'}</p>
                      </div>
                      <div className='flex shrink-0 gap-0.5'>
                        {icon(t('timesheet.action.view', { name }), <Eye />, () => onView(entry))}
                        {canManage && (
                          <>
                            {icon(t('timesheet.action.edit', { name }), <Pencil />, () => onEdit(entry))}
                            {pending &&
                              icon(
                                t('timesheet.action.approve', { name }),
                                <Check />,
                                () => decide({ entry, decision: 'approve' }),
                                { className: 'text-emerald-600', disabled: busy }
                              )}
                            {pending &&
                              icon(
                                t('timesheet.action.reject', { name }),
                                <X />,
                                () => decide({ entry, decision: 'reject' }),
                                { className: 'text-orange-600', disabled: busy }
                              )}
                            {icon(t('timesheet.action.delete', { name }), <Trash2 />, () => setDeleting(entry), {
                              className: 'text-destructive'
                            })}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
            {!isLoading && !entries.length && (
              <li className='text-muted-foreground p-6 text-center text-sm'>{t('timesheet.day.empty')}</li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
      <AlertDialogCustom
        open={!!deleting}
        onOpenChange={(open) => !open && !isDeleting && setDeleting(undefined)}
        title={t('timesheet.delete.title')}
        description={t('timesheet.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => deleting && remove(deleting)}
      />
    </>
  )
}
