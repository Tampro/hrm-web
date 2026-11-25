import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
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
import { getShiftSchema, type TShiftSchema } from '~/helpers/schemas/attendance.schema'
import { useInvalidateAttendance } from '~/hooks/apis/use-attendance-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { ShiftService } from '~/services/attendance.service'
import { EShiftFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IShift, IShiftPayload } from '~/shared/models/attendance.model'

const DEFAULT_VALUES: TShiftSchema = {
  [EShiftFormKey.Name]: '',
  [EShiftFormKey.Description]: '',
  [EShiftFormKey.StartTime]: '08:00',
  [EShiftFormKey.EndTime]: '17:00',
  [EShiftFormKey.BreakDurationMinutes]: '60',
  [EShiftFormKey.BreakStartTime]: '12:00',
  [EShiftFormKey.BreakEndTime]: '13:00',
  [EShiftFormKey.GracePeriodMinutes]: '10',
  [EShiftFormKey.NightShift]: false,
  [EShiftFormKey.Active]: true
}

const toFormValues = (s: IShift): TShiftSchema => ({
  name: s.name ?? '',
  description: s.description ?? '',
  startTime: s.startTime ? shortTime(s.startTime) : '',
  endTime: s.endTime ? shortTime(s.endTime) : '',
  breakDurationMinutes: String(s.breakDurationMinutes ?? 0),
  breakStartTime: s.breakStartTime ? shortTime(s.breakStartTime) : '',
  breakEndTime: s.breakEndTime ? shortTime(s.breakEndTime) : '',
  gracePeriodMinutes: String(s.gracePeriodMinutes ?? 0),
  nightShift: !!s.nightShift,
  active: s.status !== EOrgStatus.Inactive
})

// Spec: ShiftForm — full replacement: empty description / break times are omitted and therefore cleared
const toPayload = (v: TShiftSchema): IShiftPayload => ({
  name: v.name.trim(),
  description: v.description || undefined,
  startTime: v.startTime,
  endTime: v.endTime,
  breakDurationMinutes: Number(v.breakDurationMinutes || 0),
  breakStartTime: v.breakStartTime || undefined,
  breakEndTime: v.breakEndTime || undefined,
  gracePeriodMinutes: Number(v.gracePeriodMinutes || 0),
  nightShift: v.nightShift,
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** `null` = create, a shift = edit, `undefined` = closed */
  shift: IShift | null | undefined
  companyId?: string
  onClose: () => void
}

// Manual 6.4.5 Add / Edit Shift. Spec: POST /attendance/shifts, PUT /attendance/shifts/{id}
export function ShiftFormDialog({ shift: prop, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAttendance()
  const shift = useLastDefined(prop)
  const isEdit = !!shift

  const form = useForm<TShiftSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getShiftSchema(t)),
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (prop !== undefined) form.reset(prop ? toFormValues(prop) : DEFAULT_VALUES)
  }, [prop, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TShiftSchema) =>
      shift?.id ? ShiftService.Update(shift.id, toPayload(v)) : ShiftService.Create(companyId, toPayload(v)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'shift.toast.updated' : 'shift.toast.created'))
      onClose()
      await invalidate()
    }
  })

  const time = (name: EShiftFormKey, label: string, required?: boolean) => (
    <FormInputField control={form.control} name={name} label={label} type='time' required={required} />
  )

  return (
    <Dialog open={prop !== undefined} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'shift.form.edit_title' : 'shift.form.create_title')}</DialogTitle>
          <DialogDescription>{t('shift.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id='shift-form'
          className='-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1'
          onSubmit={form.handleSubmit((v) => mutate(v))}
          noValidate
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name={EShiftFormKey.Name}
              label={t('shift.field.name')}
              placeholder={t('shift.form.name_placeholder')}
              required
            />
            <FormTextareaField
              control={form.control}
              name={EShiftFormKey.Description}
              label={t('shift.field.description')}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              {time(EShiftFormKey.StartTime, t('shift.field.start_time'), true)}
              {time(EShiftFormKey.EndTime, t('shift.field.end_time'), true)}
            </div>
            <FormSwitchField
              control={form.control}
              name={EShiftFormKey.NightShift}
              label={t('shift.field.night_shift')}
              description={t('shift.form.night_hint')}
            />
            <div className='grid gap-4 sm:grid-cols-3'>
              <FormInputField
                control={form.control}
                name={EShiftFormKey.BreakDurationMinutes}
                label={t('shift.field.break_minutes')}
                inputMode='numeric'
              />
              {time(EShiftFormKey.BreakStartTime, t('shift.field.break_start'))}
              {time(EShiftFormKey.BreakEndTime, t('shift.field.break_end'))}
            </div>
            <FormInputField
              control={form.control}
              name={EShiftFormKey.GracePeriodMinutes}
              label={t('shift.field.grace_minutes')}
              description={t('shift.form.grace_hint')}
              inputMode='numeric'
            />
            <FormSwitchField control={form.control} name={EShiftFormKey.Active} label={t('attendance.active')} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='shift-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'shift.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
