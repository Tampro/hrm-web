import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { Field, FieldDescription, FieldGroup, FieldLegend, FieldSet } from '~/components/ui/field'
import { getHolidayCategoryName } from '~/helpers/columns/holiday-mgt-column'
import { getHolidaySchema, type THolidaySchema } from '~/helpers/schemas/holiday.schema'
import { useBranchOptionsApi } from '~/hooks/apis/use-employee-api'
import { useHolidayCategoriesApi, useInvalidateHolidays } from '~/hooks/apis/use-holiday-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { HolidayService } from '~/services/holiday.service'
import { EHolidayFormKey } from '~/shared/enums/form.enum'
import type { IHoliday, IHolidayPayload } from '~/shared/models/holiday.model'

const DEFAULT_VALUES: THolidaySchema = {
  [EHolidayFormKey.Name]: '',
  [EHolidayFormKey.CategoryId]: '',
  [EHolidayFormKey.StartDate]: '',
  [EHolidayFormKey.EndDate]: '',
  [EHolidayFormKey.Description]: '',
  [EHolidayFormKey.BranchIds]: []
}

const toFormValues = (h: IHoliday): THolidaySchema => ({
  name: h.name ?? '',
  categoryId: h.category?.id ?? '',
  startDate: h.startDate ?? '',
  endDate: h.endDate ?? '',
  description: h.description ?? '',
  branchIds: h.allBranches ? [] : (h.branches ?? []).map((b) => b.id ?? '').filter(Boolean)
})

// Spec: HolidayForm — full replacement: empty description cleared, no branchIds = all branches
const toPayload = (v: THolidaySchema): IHolidayPayload => ({
  name: v.name.trim(),
  categoryId: Number(v.categoryId),
  startDate: v.startDate,
  endDate: v.endDate,
  description: v.description || undefined,
  branchIds: v.branchIds.length ? v.branchIds.map(Number) : undefined
})

interface IProps {
  /** `null` = create, a holiday = edit, `undefined` = closed */
  holiday: IHoliday | null | undefined
  companyId?: string
  onClose: () => void
}

// Manual 6.3.4 Add Holiday: name, category, start / end date, description, applicable branches.
// Spec: POST /org/holidays, PUT /org/holidays/{id}; EMP_034 end before start, EMP_036 longer than 400 days
export function HolidayFormDialog({ holiday: holidayProp, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateHolidays()
  const holiday = useLastDefined(holidayProp)
  const isOpen = holidayProp !== undefined
  const isEdit = !!holiday
  const { data: categories = [] } = useHolidayCategoriesApi(companyId, isOpen)
  const { data: branches = [] } = useBranchOptionsApi(companyId, isOpen)

  // branches of the holiday that are no longer active still show (and stay checked)
  const branchItems = [
    ...branches.map((b) => ({ id: b.id ?? '', name: b.name ?? '-' })),
    ...(holiday?.branches ?? [])
      .filter((b) => b.id && !branches.some((x) => x.id === b.id))
      .map((b) => ({ id: b.id ?? '', name: b.name ?? '-' }))
  ]

  const form = useForm<THolidaySchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getHolidaySchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (holidayProp !== undefined) form.reset(holidayProp ? toFormValues(holidayProp) : DEFAULT_VALUES)
  }, [holidayProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: THolidaySchema) =>
      holiday?.id
        ? HolidayService.Update(holiday.id, toPayload(values))
        : HolidayService.Create(companyId, toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'holiday.toast.updated' : 'holiday.toast.created'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'holiday.form.edit_title' : 'holiday.form.create_title')}</DialogTitle>
          <DialogDescription>{t('holiday.form.description')}</DialogDescription>
        </DialogHeader>
        <form id='holiday-form' className='min-w-0' onSubmit={form.handleSubmit((v) => mutate(v))} noValidate>
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={EHolidayFormKey.Name}
                label={t('holiday.field.name')}
                placeholder={t('holiday.form.name_placeholder')}
                required
              />
              <FormSelectField
                control={form.control}
                name={EHolidayFormKey.CategoryId}
                label={t('holiday.field.category')}
                options={categories.map((c) => ({ label: getHolidayCategoryName(t, c), value: c.id ?? '' }))}
              />
              <FormDateField
                control={form.control}
                name={EHolidayFormKey.StartDate}
                label={t('holiday.field.start_date')}
                required
              />
              <FormDateField
                control={form.control}
                name={EHolidayFormKey.EndDate}
                label={t('holiday.field.end_date')}
                description={t('holiday.form.end_hint')}
                required
              />
            </div>
            <FormTextareaField
              control={form.control}
              name={EHolidayFormKey.Description}
              label={t('holiday.field.description')}
            />
            <Controller
              name={EHolidayFormKey.BranchIds}
              control={form.control}
              render={({ field }) => (
                <FieldSet>
                  <FieldLegend variant='label'>{t('holiday.field.branches')}</FieldLegend>
                  <FieldDescription>{t('holiday.form.branches_hint')}</FieldDescription>
                  {branchItems.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>{t('holiday.form.no_branch')}</p>
                  ) : (
                    <div className='grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2'>
                      {branchItems.map((b) => (
                        <Field key={b.id} orientation='horizontal'>
                          <label className='flex items-center gap-2 text-sm'>
                            <input
                              type='checkbox'
                              className='accent-primary size-4'
                              checked={field.value.includes(b.id)}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.checked ? [...field.value, b.id] : field.value.filter((id) => id !== b.id)
                                )
                              }
                            />
                            {b.name}
                          </label>
                        </Field>
                      ))}
                    </div>
                  )}
                </FieldSet>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='holiday-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'holiday.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
