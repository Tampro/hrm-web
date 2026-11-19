import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AWARD_ICONS, DEFAULT_AWARD_ICON } from '~/components/customs/award-icon'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { Button } from '~/components/ui/button'
import { FieldGroup, FieldLegend, FieldSet } from '~/components/ui/field'
import { getAwardTypeSchema, type TAwardTypeSchema } from '~/helpers/schemas/org.schema'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { cn } from '~/lib/utils'
import { AwardTypeService } from '~/services/org.service'
import { EAwardTypeFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IAwardType, IAwardTypePayload } from '~/shared/models/org.model'

const DEFAULT_VALUES: TAwardTypeSchema = {
  [EAwardTypeFormKey.Name]: '',
  [EAwardTypeFormKey.Description]: '',
  [EAwardTypeFormKey.Icon]: DEFAULT_AWARD_ICON,
  [EAwardTypeFormKey.Active]: true
}

// Spec: AwardTypeForm — PUT is a full replacement: an empty description is omitted and therefore cleared
const toPayload = (v: TAwardTypeSchema): IAwardTypePayload => ({
  name: v.name.trim(),
  description: v.description || undefined,
  icon: v.icon || undefined,
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** award type being edited; undefined = add mode */
  editing?: IAwardType
  companyId?: string
  onDone: () => void
  /** refetch the list after a save */
  onSaved: () => Promise<unknown>
}

// Manual 6.3.6 "Add New Award Type" (left column): name, description, status — plus the icon the backend stores.
// Spec: POST /org/award-types, PUT /org/award-types/{id}; EMP_011 = name already used
export function AwardTypeForm({ editing, companyId, onDone, onSaved }: IProps) {
  const { t } = useTranslation()
  const isEdit = !!editing
  const form = useForm<TAwardTypeSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getAwardTypeSchema(t)),
    // not 'all': blurring the empty name on the way to Save would show its error, push Save down and lose the click
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    form.reset(
      editing
        ? {
            name: editing.name ?? '',
            description: editing.description ?? '',
            icon: editing.icon && AWARD_ICONS[editing.icon] ? editing.icon : DEFAULT_AWARD_ICON,
            active: editing.status !== EOrgStatus.Inactive
          }
        : DEFAULT_VALUES
    )
  }, [editing, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TAwardTypeSchema) =>
      editing?.id
        ? AwardTypeService.Update(editing.id, toPayload(v))
        : AwardTypeService.Create(companyId, toPayload(v)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'award_type.toast.updated' : 'award_type.toast.created'))
      form.reset(DEFAULT_VALUES)
      onDone()
      await onSaved()
    }
  })

  const title = t(isEdit ? 'award_type.form.edit_title' : 'award_type.form.create_title')

  return (
    <form
      aria-label={title}
      className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5'
      onSubmit={form.handleSubmit((v) => mutate(v))}
      noValidate
    >
      <h2 className='font-semibold'>{title}</h2>
      <FieldGroup>
        <FormInputField
          control={form.control}
          name={EAwardTypeFormKey.Name}
          label={t('award_type.field.name')}
          placeholder={t('award_type.form.name_placeholder')}
          required
        />
        <FormTextareaField
          control={form.control}
          name={EAwardTypeFormKey.Description}
          label={t('award_type.field.description')}
        />
        <Controller
          name={EAwardTypeFormKey.Icon}
          control={form.control}
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant='label'>{t('award_type.field.icon')}</FieldLegend>
              <div role='radiogroup' aria-label={t('award_type.field.icon')} className='flex flex-wrap gap-2'>
                {Object.entries(AWARD_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    type='button'
                    role='radio'
                    aria-checked={field.value === key}
                    aria-label={t('award_type.icon_named', { name: key })}
                    onClick={() => field.onChange(key)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md border transition-colors',
                      field.value === key ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className='size-4' />
                  </button>
                ))}
              </div>
            </FieldSet>
          )}
        />
        <FormSwitchField
          control={form.control}
          name={EAwardTypeFormKey.Active}
          label={t('award_type.field.active')}
          description={t('award_type.form.active_hint')}
        />
      </FieldGroup>
      <div className='flex justify-end gap-2'>
        {isEdit && (
          <Button type='button' variant='outline' className='h-[38px]' onClick={onDone} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type='submit' className='h-[38px]' disabled={isPending}>
          {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'award_type.form.create_submit')}
        </Button>
      </div>
    </form>
  )
}
