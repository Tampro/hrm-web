import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { FormDateField } from '~/components/forms/form-date-field'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { FieldGroup } from '~/components/ui/field'
import { shortTime } from '~/helpers/columns/attendance-mgt-column'
import { getAttendanceRecordSchema, type TAttendanceRecordSchema } from '~/helpers/schemas/attendance.schema'
import { useInvalidateAttendance } from '~/hooks/apis/use-attendance-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { AttendanceRecordService } from '~/services/attendance.service'
import { EAttendanceRecordFormKey } from '~/shared/enums/form.enum'
import type { IAttendanceRecordPayload } from '~/shared/models/attendance.model'
import type { ITabOption } from '~/shared/models/common.model'

/** What the dialog opens on: a new record (optionally for an employee / day) or an existing one */
export interface IRecordTarget {
  recordId?: string | null
  employeeId?: string
  date?: string
  clockIn?: string | null
  clockOut?: string | null
  notes?: string | null
}

const toFormValues = (r: IRecordTarget): TAttendanceRecordSchema => ({
  employeeId: r.employeeId ?? '',
  date: r.date ?? '',
  clockIn: r.clockIn ? shortTime(r.clockIn) : '',
  clockOut: r.clockOut ? shortTime(r.clockOut) : '',
  notes: r.notes ?? ''
})

// Spec: RecordForm — full replacement: empty clock times / notes are omitted and therefore cleared
const toPayload = (v: TAttendanceRecordSchema): IAttendanceRecordPayload => ({
  employeeId: Number(v.employeeId),
  date: v.date,
  clockIn: v.clockIn || undefined,
  clockOut: v.clockOut || undefined,
  notes: v.notes.trim() || undefined
})

interface IProps {
  /** `undefined` = closed */
  target: IRecordTarget | undefined
  employees: ITabOption[]
  canManage: boolean
  onClose: () => void
}

// Manual 6.4.1 Add / Edit attendance record. Spec: POST /attendance/records, PUT / DELETE /attendance/records/{id}
export function RecordFormDialog({ target: prop, employees, canManage, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAttendance()
  const target = useLastDefined(prop)
  const recordId = target?.recordId ?? undefined
  const [confirmDelete, setConfirmDelete] = useState(false)

  const form = useForm<TAttendanceRecordSchema>({
    defaultValues: toFormValues({}),
    resolver: zodResolver(getAttendanceRecordSchema(t)),
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (prop) form.reset(toFormValues(prop))
  }, [prop, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TAttendanceRecordSchema) =>
      recordId ? AttendanceRecordService.Update(recordId, toPayload(v)) : AttendanceRecordService.Create(toPayload(v)),
    onSuccess: async () => {
      toast.success(t(recordId ? 'attendance_record.toast.updated' : 'attendance_record.toast.created'))
      onClose()
      await invalidate()
    }
  })

  const { mutate: remove, isPending: isDeleting } = useMutationApi({
    mutationFn: (id: string) => AttendanceRecordService.Delete(id),
    onSuccess: async () => {
      toast.success(t('attendance_record.toast.deleted'))
      setConfirmDelete(false)
      onClose()
      await invalidate()
    }
  })

  const busy = isPending || isDeleting

  return (
    <>
      <Dialog open={prop !== undefined} onOpenChange={(open) => !open && !busy && onClose()}>
        <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {t(recordId ? 'attendance_record.form.edit_title' : 'attendance_record.form.create_title')}
            </DialogTitle>
            <DialogDescription>{t('attendance_record.form.description')}</DialogDescription>
          </DialogHeader>
          <form
            id='attendance-record-form'
            className='-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1'
            onSubmit={form.handleSubmit((v) => mutate(v))}
            noValidate
          >
            <FieldGroup>
              <FormSelectField
                control={form.control}
                name={EAttendanceRecordFormKey.EmployeeId}
                label={t('attendance_record.field.employee')}
                options={employees}
                disabled={!!recordId}
              />
              <FormDateField
                control={form.control}
                name={EAttendanceRecordFormKey.Date}
                label={t('attendance_record.field.date')}
                required
              />
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormInputField
                  control={form.control}
                  name={EAttendanceRecordFormKey.ClockIn}
                  label={t('attendance_record.field.clock_in')}
                  description={t('attendance_record.form.clock_in_hint')}
                  type='time'
                />
                <FormInputField
                  control={form.control}
                  name={EAttendanceRecordFormKey.ClockOut}
                  label={t('attendance_record.field.clock_out')}
                  description={t('attendance_record.form.clock_out_hint')}
                  type='time'
                />
              </div>
              <FormTextareaField
                control={form.control}
                name={EAttendanceRecordFormKey.Notes}
                label={t('attendance_record.field.notes')}
              />
            </FieldGroup>
          </form>
          <DialogFooter className='sm:justify-between'>
            {recordId && canManage ? (
              <Button
                variant='outline'
                className='text-destructive h-[38px]'
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                {t('common.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className='flex gap-2'>
              <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={busy}>
                {t('common.cancel')}
              </Button>
              {canManage && (
                <Button type='submit' form='attendance-record-form' className='h-[38px]' disabled={busy}>
                  {isPending
                    ? t('common.saving')
                    : t(recordId ? 'common.save' : 'attendance_record.form.create_submit')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialogCustom
        open={confirmDelete}
        onOpenChange={(open) => !open && !isDeleting && setConfirmDelete(false)}
        title={t('attendance_record.delete.title')}
        description={t('attendance_record.delete.description')}
        confirmText={t('common.delete')}
        isDestructive
        loading={isDeleting}
        onConfirm={() => recordId && remove(recordId)}
      />
    </>
  )
}
