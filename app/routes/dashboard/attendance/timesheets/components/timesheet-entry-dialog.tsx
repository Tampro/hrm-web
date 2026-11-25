import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
import { getTimesheetEntrySchema, type TTimesheetEntrySchema } from '~/helpers/schemas/attendance.schema'
import { useInvalidateAttendance } from '~/hooks/apis/use-attendance-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { TimesheetService } from '~/services/attendance.service'
import { ETimesheetEntryFormKey } from '~/shared/enums/form.enum'
import type { ITimesheetEntry, ITimesheetEntryPayload } from '~/shared/models/attendance.model'
import type { ITabOption } from '~/shared/models/common.model'

const toFormValues = (e: ITimesheetEntry): TTimesheetEntrySchema => ({
  employeeId: e.employeeId ?? '',
  date: e.date ?? '',
  hours: e.hours === null || e.hours === undefined ? '' : String(e.hours),
  project: e.project ?? '',
  description: e.description ?? ''
})

// Spec: EntryForm — full replacement: an empty project is omitted and therefore cleared
const toPayload = (v: TTimesheetEntrySchema): ITimesheetEntryPayload => ({
  employeeId: Number(v.employeeId),
  date: v.date,
  hours: Number(v.hours),
  project: v.project.trim() || undefined,
  description: v.description.trim()
})

interface IProps {
  /** an entry with `id` = edit, without = create (optionally prefilled), `undefined` = closed */
  entry: ITimesheetEntry | undefined
  employees: ITabOption[]
  /** view only: fields disabled, no Save */
  readOnly?: boolean
  onClose: () => void
}

// Manual 6.4.2 Add / Edit / View timesheet entry. Spec: POST /timesheets/entries, PUT /timesheets/entries/{id}
export function TimesheetEntryDialog({ entry: prop, employees, readOnly, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAttendance()
  const entry = useLastDefined(prop)
  const id = entry?.id

  const form = useForm<TTimesheetEntrySchema>({
    defaultValues: toFormValues({}),
    resolver: zodResolver(getTimesheetEntrySchema(t)),
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (prop) form.reset(toFormValues(prop))
  }, [prop, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TTimesheetEntrySchema) =>
      id ? TimesheetService.Update(id, toPayload(v)) : TimesheetService.Create(toPayload(v)),
    onSuccess: async () => {
      toast.success(t(id ? 'timesheet.toast.updated' : 'timesheet.toast.created'))
      onClose()
      await invalidate()
    }
  })

  const titleKey = readOnly
    ? 'timesheet.form.view_title'
    : id
      ? 'timesheet.form.edit_title'
      : 'timesheet.form.create_title'

  return (
    <Dialog open={prop !== undefined} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t('timesheet.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id='timesheet-entry-form'
          className='-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1'
          onSubmit={form.handleSubmit((v) => mutate(v))}
          noValidate
        >
          <fieldset disabled={readOnly} className='contents'>
            <FieldGroup>
              <FormSelectField
                control={form.control}
                name={ETimesheetEntryFormKey.EmployeeId}
                label={t('timesheet.field.employee')}
                options={employees}
                disabled={readOnly || !!id}
              />
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormDateField
                  control={form.control}
                  name={ETimesheetEntryFormKey.Date}
                  label={t('timesheet.field.date')}
                  required
                />
                <FormInputField
                  control={form.control}
                  name={ETimesheetEntryFormKey.Hours}
                  label={t('timesheet.field.hours')}
                  description={t('timesheet.form.hours_hint')}
                  inputMode='decimal'
                  required
                />
              </div>
              <FormInputField
                control={form.control}
                name={ETimesheetEntryFormKey.Project}
                label={t('timesheet.field.project')}
              />
              <FormTextareaField
                control={form.control}
                name={ETimesheetEntryFormKey.Description}
                label={t('timesheet.field.description')}
              />
              {readOnly && entry?.managerComments && (
                <p className='text-muted-foreground text-sm'>
                  {t('timesheet.field.manager_comments')}: {entry.managerComments}
                </p>
              )}
            </FieldGroup>
          </fieldset>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t(readOnly ? 'common.close' : 'common.cancel')}
          </Button>
          {!readOnly && (
            <Button type='submit' form='timesheet-entry-form' className='h-[38px]' disabled={isPending}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
