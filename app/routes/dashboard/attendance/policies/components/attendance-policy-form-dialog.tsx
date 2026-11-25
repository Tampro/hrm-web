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
import { getAttendancePolicySchema, type TAttendancePolicySchema } from '~/helpers/schemas/attendance.schema'
import { useInvalidateAttendance } from '~/hooks/apis/use-attendance-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { AttendancePolicyService } from '~/services/attendance.service'
import { EAttendancePolicyFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IAttendancePolicy, IAttendancePolicyPayload } from '~/shared/models/attendance.model'

// Spec: PolicyForm defaults — 15 / 15 minutes, half day under 4.00 hours
const DEFAULT_VALUES: TAttendancePolicySchema = {
  [EAttendancePolicyFormKey.Name]: '',
  [EAttendancePolicyFormKey.Description]: '',
  [EAttendancePolicyFormKey.LateArrivalGraceMinutes]: '15',
  [EAttendancePolicyFormKey.EarlyDepartureGraceMinutes]: '15',
  [EAttendancePolicyFormKey.HalfDayThresholdHours]: '4',
  [EAttendancePolicyFormKey.OvertimeRatePerHour]: '',
  [EAttendancePolicyFormKey.Active]: true
}

const toFormValues = (p: IAttendancePolicy): TAttendancePolicySchema => ({
  name: p.name ?? '',
  description: p.description ?? '',
  lateArrivalGraceMinutes: String(p.lateArrivalGraceMinutes ?? 15),
  earlyDepartureGraceMinutes: String(p.earlyDepartureGraceMinutes ?? 15),
  halfDayThresholdHours: String(p.halfDayThresholdHours ?? 4),
  overtimeRatePerHour:
    p.overtimeRatePerHour === null || p.overtimeRatePerHour === undefined ? '' : String(p.overtimeRatePerHour),
  active: p.status !== EOrgStatus.Inactive
})

const toPayload = (v: TAttendancePolicySchema): IAttendancePolicyPayload => ({
  name: v.name.trim(),
  description: v.description || undefined,
  lateArrivalGraceMinutes: Number(v.lateArrivalGraceMinutes),
  earlyDepartureGraceMinutes: Number(v.earlyDepartureGraceMinutes),
  halfDayThresholdHours: Number(v.halfDayThresholdHours),
  overtimeRatePerHour: Number(v.overtimeRatePerHour),
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** `null` = create, a policy = edit, `undefined` = closed */
  policy: IAttendancePolicy | null | undefined
  companyId?: string
  currencySymbol?: string | null
  onClose: () => void
}

// Manual 6.4.6 Add / Edit Attendance Policy. Spec: POST /attendance/policies, PUT /attendance/policies/{id}
export function AttendancePolicyFormDialog({ policy: prop, companyId, currencySymbol, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAttendance()
  const policy = useLastDefined(prop)
  const isEdit = !!policy

  const form = useForm<TAttendancePolicySchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getAttendancePolicySchema(t)),
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (prop !== undefined) form.reset(prop ? toFormValues(prop) : DEFAULT_VALUES)
  }, [prop, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TAttendancePolicySchema) =>
      policy?.id
        ? AttendancePolicyService.Update(policy.id, toPayload(v))
        : AttendancePolicyService.Create(companyId, toPayload(v)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'attendance_policy.toast.updated' : 'attendance_policy.toast.created'))
      onClose()
      await invalidate()
    }
  })

  const number = (name: EAttendancePolicyFormKey, label: string, description?: string) => (
    <FormInputField
      control={form.control}
      name={name}
      label={label}
      description={description}
      inputMode='decimal'
      required
    />
  )

  return (
    <Dialog open={prop !== undefined} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {t(isEdit ? 'attendance_policy.form.edit_title' : 'attendance_policy.form.create_title')}
          </DialogTitle>
          <DialogDescription>{t('attendance_policy.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id='attendance-policy-form'
          className='-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1'
          onSubmit={form.handleSubmit((v) => mutate(v))}
          noValidate
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name={EAttendancePolicyFormKey.Name}
              label={t('attendance_policy.field.name')}
              placeholder={t('attendance_policy.form.name_placeholder')}
              required
            />
            <FormTextareaField
              control={form.control}
              name={EAttendancePolicyFormKey.Description}
              label={t('attendance_policy.field.description')}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              {number(
                EAttendancePolicyFormKey.LateArrivalGraceMinutes,
                t('attendance_policy.field.late_grace_minutes')
              )}
              {number(
                EAttendancePolicyFormKey.EarlyDepartureGraceMinutes,
                t('attendance_policy.field.early_grace_minutes')
              )}
              {number(
                EAttendancePolicyFormKey.HalfDayThresholdHours,
                t('attendance_policy.field.half_day_hours'),
                t('attendance_policy.form.half_day_hint')
              )}
              {number(
                EAttendancePolicyFormKey.OvertimeRatePerHour,
                t('attendance_policy.field.overtime_rate_with_currency', { currency: currencySymbol ?? '' })
              )}
            </div>
            <FormSwitchField
              control={form.control}
              name={EAttendancePolicyFormKey.Active}
              label={t('attendance.active')}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='attendance-policy-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'attendance_policy.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
