import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormDateField } from '~/components/forms/form-date-field'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { Button } from '~/components/ui/button'
import { Field, FieldError } from '~/components/ui/field'
import { UploadFile } from '~/components/uploads/upload-file'
import type { TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import type { IDocumentType } from '~/shared/models/employee.model'
import { EEmployeeFormKey } from '~/shared/enums/form.enum'

import { EmployeeFormSection } from './employee-form-section'

/** Spec: a document is a media file of the company, max 5 MB (EMP_024) */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
/** Spec: media-service allowed types */
export const DOCUMENT_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt,.csv'

interface IProps {
  form: UseFormReturn<TEmployeeSchema>
  documentTypes: IDocumentType[]
}

// Step 4 (create only): the login account (email = username) and the documents attached at creation
export function StepAccount({ form, documentTypes }: IProps) {
  const { t } = useTranslation()
  const { control } = form
  const [showPassword, setShowPassword] = useState(false)
  const { fields, append, remove } = useFieldArray({ control, name: EEmployeeFormKey.Documents })
  const typeOptions = documentTypes.map((d) => ({ label: d.name ?? '-', value: d.id ?? '' }))

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <EmployeeFormSection title={t('employee.section.account')}>
        <FormInputField
          control={control}
          name={EEmployeeFormKey.Email}
          label={t('employee.field.email')}
          description={t('employee.email_hint')}
          type='email'
          autoComplete='off'
          required
        />
        <FormInputField
          control={control}
          name={EEmployeeFormKey.Password}
          label={t('employee.field.first_password')}
          description={t('employee.first_password_hint')}
          type={showPassword ? 'text' : 'password'}
          autoComplete='new-password'
          suffix={
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={t(showPassword ? 'auth.login.hide_password' : 'auth.login.show_password')}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          }
        />
      </EmployeeFormSection>

      <section
        aria-label={t('employee.section.documents')}
        className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5'
      >
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-muted-foreground text-sm font-semibold uppercase'>{t('employee.section.documents')}</h2>
          <Button
            type='button'
            variant='outline'
            className='h-[38px]'
            onClick={() => append({ documentTypeId: '', file: null, expiryDate: '' })}
          >
            <Plus />
            {t('employee.document.add')}
          </Button>
        </div>
        {fields.length === 0 && <p className='text-muted-foreground text-sm'>{t('employee.document.none_yet')}</p>}
        {fields.map((row, index) => (
          <div
            key={row.id}
            role='group'
            aria-label={t('employee.document.row', { index: index + 1 })}
            className='grid items-start gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]'
          >
            <FormSelectField
              control={control}
              name={`${EEmployeeFormKey.Documents}.${index}.documentTypeId`}
              label={t('employee.document.type')}
              options={typeOptions}
            />
            <Controller
              name={`${EEmployeeFormKey.Documents}.${index}.file`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <UploadFile
                    value={field.value ? [field.value] : []}
                    onChange={(files) => field.onChange(files[0] ?? null)}
                    accept={DOCUMENT_ACCEPT}
                    maxFileSizeBytes={MAX_DOCUMENT_BYTES}
                    maxFileSizeExceeded={t('upload.too_large', { size: '5 MB' })}
                    title={t('employee.document.choose_file')}
                    description={t('employee.document.file_hint')}
                    isInValid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <FormDateField
              control={control}
              name={`${EEmployeeFormKey.Documents}.${index}.expiryDate`}
              label={t('employee.document.expiry_date')}
            />
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              className='text-destructive md:mt-6'
              aria-label={t('employee.document.remove_row', { index: index + 1 })}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </section>
    </div>
  )
}
