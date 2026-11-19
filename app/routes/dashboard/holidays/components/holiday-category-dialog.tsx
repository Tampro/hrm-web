import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { getHolidayCategoryName } from '~/helpers/columns/holiday-mgt-column'
import { getHolidayCategorySchema, type THolidayCategorySchema } from '~/helpers/schemas/holiday.schema'
import { useHolidayCategoriesApi, useInvalidateHolidays } from '~/hooks/apis/use-holiday-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { HolidayService } from '~/services/holiday.service'
import { EHolidayCategoryFormKey } from '~/shared/enums/form.enum'
import type { IHolidayCategory } from '~/shared/models/holiday.model'

const DEFAULT_VALUES: THolidayCategorySchema = { name: '', color: '#FB8C00' }

interface IProps {
  open: boolean
  companyId?: string
  onClose: () => void
}

// Spec: GET / POST /org/holiday-categories, PUT / DELETE /{id} — the 4 system categories are read-only (EMP_035),
// a category used by a holiday cannot be deleted (EMP_010)
export function HolidayCategoryDialog({ open, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateHolidays()
  const { data: categories = [] } = useHolidayCategoriesApi(companyId, open)
  const [editing, setEditing] = useState<IHolidayCategory | undefined>()

  const form = useForm<THolidayCategorySchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getHolidayCategorySchema(t)),
    mode: 'all'
  })

  const startEdit = (category?: IHolidayCategory) => {
    setEditing(category)
    form.reset(category ? { name: category.name ?? '', color: category.color ?? DEFAULT_VALUES.color } : DEFAULT_VALUES)
  }

  const save = useMutationApi({
    mutationFn: (values: THolidayCategorySchema) =>
      editing?.id
        ? HolidayService.UpdateCategory(editing.id, { name: values.name.trim(), color: values.color })
        : HolidayService.CreateCategory(companyId, { name: values.name.trim(), color: values.color }),
    onSuccess: async () => {
      toast.success(t(editing ? 'holiday.category.toast.updated' : 'holiday.category.toast.created'))
      await invalidate()
      startEdit(undefined)
    }
  })
  const remove = useMutationApi({
    mutationFn: (category: IHolidayCategory) => HolidayService.DeleteCategory(category.id ?? ''),
    onSuccess: async () => {
      toast.success(t('holiday.category.toast.deleted'))
      await invalidate()
    }
  })

  const close = () => {
    startEdit(undefined)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !save.isPending && close()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('holiday.category.title')}</DialogTitle>
          <DialogDescription>{t('holiday.category.description')}</DialogDescription>
        </DialogHeader>

        <ul className='flex max-h-60 flex-col gap-1 overflow-y-auto' aria-label={t('holiday.category.title')}>
          {categories.map((c) => (
            <li key={c.id} className='flex items-center justify-between gap-2 rounded-md border px-3 py-1.5'>
              <span className='flex min-w-0 items-center gap-2 text-sm'>
                <span aria-hidden className='size-3 shrink-0 rounded-full' style={{ backgroundColor: c.color }} />
                <span className='truncate'>{getHolidayCategoryName(t, c)}</span>
                {c.system && (
                  <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
                    <Lock className='size-3' />
                    {t('holiday.category.system')}
                  </span>
                )}
              </span>
              {!c.system && (
                <span className='flex shrink-0 gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('holiday.category.edit_named', { name: c.name ?? '' })}
                    onClick={() => startEdit(c)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-destructive'
                    aria-label={t('holiday.category.delete_named', { name: c.name ?? '' })}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(c)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>

        <form
          id='holiday-category-form'
          aria-label={t(editing ? 'holiday.category.edit' : 'holiday.category.add')}
          className='grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_8rem]'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          noValidate
        >
          <FormInputField
            control={form.control}
            name={EHolidayCategoryFormKey.Name}
            label={t(editing ? 'holiday.category.edit' : 'holiday.category.add')}
            placeholder={t('holiday.category.name_placeholder')}
            required
          />
          <Controller
            name={EHolidayCategoryFormKey.Color}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='holiday-category-color'>{t('holiday.category.color')}</FieldLabel>
                <Input
                  id='holiday-category-color'
                  type='color'
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className='h-[38px] p-1'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          {editing && (
            <Button variant='outline' className='h-[38px]' onClick={() => startEdit(undefined)}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type='submit' form='holiday-category-form' className='h-[38px]' disabled={save.isPending}>
            {save.isPending ? t('common.saving') : t(editing ? 'common.save' : 'holiday.category.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
