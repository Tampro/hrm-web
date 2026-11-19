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
import { getColorCategorySchema, type TColorCategorySchema } from '~/helpers/schema.helper'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { EColorCategoryFormKey } from '~/shared/enums/form.enum'
import type { IApiResponse } from '~/shared/models/common.model'

/** A category with a colour: system ones are shared by every company and read-only */
export interface IColorCategory {
  id?: string
  name?: string
  color?: string
  system?: boolean
}

interface IProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  categories: IColorCategory[]
  /** shown name (e.g. translated system names) */
  getName: (category: IColorCategory) => string
  onCreate: (values: TColorCategorySchema) => Promise<IApiResponse<unknown>>
  onUpdate: (id: string, values: TColorCategorySchema) => Promise<IApiResponse<unknown>>
  onDelete: (id: string) => Promise<IApiResponse<unknown>>
  /** refetch what depends on the categories */
  onChanged: () => Promise<unknown>
}

const DEFAULT_VALUES: TColorCategorySchema = { name: '', color: '#FB8C00' }

/**
 * Manage the categories of a feature (holidays, announcements…): system ones read-only, the company's own can be
 * added, renamed / recoloured and deleted (the backend refuses a category still in use and the error is toasted).
 */
export function ColorCategoryDialog({
  open,
  onClose,
  title,
  description,
  categories,
  getName,
  onCreate,
  onUpdate,
  onDelete,
  onChanged
}: IProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<IColorCategory | undefined>()

  const form = useForm<TColorCategorySchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getColorCategorySchema(t)),
    mode: 'all'
  })

  const startEdit = (category?: IColorCategory) => {
    setEditing(category)
    form.reset(category ? { name: category.name ?? '', color: category.color ?? DEFAULT_VALUES.color } : DEFAULT_VALUES)
  }

  const save = useMutationApi({
    mutationFn: (values: TColorCategorySchema) => {
      const payload = { name: values.name.trim(), color: values.color }
      return editing?.id ? onUpdate(editing.id, payload) : onCreate(payload)
    },
    onSuccess: async () => {
      toast.success(t(editing ? 'category_dialog.toast.updated' : 'category_dialog.toast.created'))
      startEdit(undefined)
      // refetch in the background: the dialog must not stay busy (Escape is ignored while saving)
      void onChanged()
    }
  })
  const remove = useMutationApi({
    mutationFn: (category: IColorCategory) => onDelete(category.id ?? ''),
    onSuccess: async () => {
      toast.success(t('category_dialog.toast.deleted'))
      void onChanged()
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className='flex max-h-60 flex-col gap-1 overflow-y-auto' aria-label={title}>
          {categories.map((c) => (
            <li key={c.id} className='flex items-center justify-between gap-2 rounded-md border px-3 py-1.5'>
              <span className='flex min-w-0 items-center gap-2 text-sm'>
                <span aria-hidden className='size-3 shrink-0 rounded-full' style={{ backgroundColor: c.color }} />
                <span className='truncate'>{getName(c)}</span>
                {c.system && (
                  <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
                    <Lock className='size-3' />
                    {t('category_dialog.system')}
                  </span>
                )}
              </span>
              {!c.system && (
                <span className='flex shrink-0 gap-1'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('category_dialog.edit_named', { name: getName(c) })}
                    onClick={() => startEdit(c)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-destructive'
                    aria-label={t('category_dialog.delete_named', { name: getName(c) })}
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
          id='color-category-form'
          aria-label={t(editing ? 'category_dialog.edit' : 'category_dialog.add')}
          className='grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_8rem]'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          noValidate
        >
          <FormInputField
            control={form.control}
            name={EColorCategoryFormKey.Name}
            label={t(editing ? 'category_dialog.edit' : 'category_dialog.add')}
            placeholder={t('category_dialog.name_placeholder')}
            required
          />
          <Controller
            name={EColorCategoryFormKey.Color}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='color-category-color'>{t('category_dialog.color')}</FieldLabel>
                <Input
                  id='color-category-color'
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
          <Button type='submit' form='color-category-form' className='h-[38px]' disabled={save.isPending}>
            {save.isPending ? t('common.saving') : t(editing ? 'common.save' : 'category_dialog.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
