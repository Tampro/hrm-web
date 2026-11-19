import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { Button } from '~/components/ui/button'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '~/components/ui/field'
import { getDocumentTypeSchema, type TDocumentTypeSchema } from '~/helpers/schemas/org.schema'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { cn } from '~/lib/utils'
import { DocumentTypeService } from '~/services/org.service'
import { EDocumentTypeFormKey } from '~/shared/enums/form.enum'
import type { IDocumentType } from '~/shared/models/employee.model'

const DEFAULT_VALUES: TDocumentTypeSchema = {
  [EDocumentTypeFormKey.Name]: '',
  [EDocumentTypeFormKey.Description]: '',
  [EDocumentTypeFormKey.Required]: false
}

interface IProps {
  /** type being edited; undefined = add mode */
  editing?: IDocumentType
  companyId?: string
  onDone: () => void
  onSaved: () => Promise<unknown>
}

// Manual 6.3.7 "Add New Document Type" (left column): name, description, Required / Optional.
// Spec: POST /org/document-types, PUT /{id} (company's own types, full replacement), PUT /{id}/required (a system
// type: name and description are shared and read-only, only Required is the company's choice); EMP_011 name taken
export function DocumentTypeForm({ editing, companyId, onDone, onSaved }: IProps) {
  const { t } = useTranslation()
  const isEdit = !!editing
  const isSystem = !!editing?.system
  const form = useForm<TDocumentTypeSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getDocumentTypeSchema(t)),
    // not 'all': blurring the empty name on the way to Save would show its error, push Save down and lose the click
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    form.reset(
      editing
        ? { name: editing.name ?? '', description: editing.description ?? '', required: !!editing.required }
        : DEFAULT_VALUES
    )
  }, [editing, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (v: TDocumentTypeSchema) => {
      if (editing?.id && isSystem) return DocumentTypeService.SetRequired(editing.id, companyId, v.required)
      const payload = { name: v.name.trim(), description: v.description || undefined, required: v.required }
      return editing?.id
        ? DocumentTypeService.Update(editing.id, payload)
        : DocumentTypeService.Create(companyId, payload)
    },
    onSuccess: async () => {
      toast.success(t(isEdit ? 'document_type.toast.updated' : 'document_type.toast.created'))
      form.reset(DEFAULT_VALUES)
      onDone()
      await onSaved()
    }
  })

  const title = t(isEdit ? 'document_type.form.edit_title' : 'document_type.form.create_title')

  return (
    <form
      aria-label={title}
      className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5'
      onSubmit={form.handleSubmit((v) => mutate(v))}
      noValidate
    >
      <h2 className='font-semibold'>{title}</h2>
      {isSystem && (
        <p className='bg-muted/50 text-muted-foreground rounded-md p-3 text-sm'>
          {t('document_type.form.system_hint')}
        </p>
      )}
      <FieldGroup>
        <FormInputField
          control={form.control}
          name={EDocumentTypeFormKey.Name}
          label={t('document_type.field.name')}
          placeholder={t('document_type.form.name_placeholder')}
          disabled={isSystem}
          required
        />
        {isSystem ? (
          <p className='text-muted-foreground text-sm'>{editing?.description || '-'}</p>
        ) : (
          <FormTextareaField
            control={form.control}
            name={EDocumentTypeFormKey.Description}
            label={t('document_type.field.description')}
          />
        )}
        <Controller
          name={EDocumentTypeFormKey.Required}
          control={form.control}
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant='label'>{t('document_type.field.required')}</FieldLegend>
              <div role='radiogroup' aria-label={t('document_type.field.required')} className='grid grid-cols-2 gap-2'>
                {[true, false].map((value) => (
                  <label
                    key={String(value)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm',
                      field.value === value && 'border-primary bg-primary/5'
                    )}
                  >
                    <input
                      type='radio'
                      name='document-type-required'
                      className='accent-primary'
                      checked={field.value === value}
                      onChange={() => field.onChange(value)}
                    />
                    {t(value ? 'document_type.required' : 'document_type.optional')}
                  </label>
                ))}
              </div>
              <FieldDescription>{t('document_type.form.required_hint')}</FieldDescription>
            </FieldSet>
          )}
        />
      </FieldGroup>
      <div className='flex justify-end gap-2'>
        {isEdit && (
          <Button type='button' variant='outline' className='h-[38px]' onClick={onDone} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type='submit' className='h-[38px]' disabled={isPending}>
          {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'document_type.form.create_submit')}
        </Button>
      </div>
    </form>
  )
}
