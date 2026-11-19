import { X } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Avatar } from '~/components/customs/avatar-custom'
import { FormDateField } from '~/components/forms/form-date-field'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { Button } from '~/components/ui/button'
import { UploadFile } from '~/components/uploads/upload-file'
import type { TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import { DATA } from '~/shared/constants/data.constant'
import { EEmployeeFormKey } from '~/shared/enums/form.enum'

import { EmployeeFormSection } from './employee-form-section'

/** Spec: profile image of the company media library, image, max 2 MB (EMP_018) */
export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024

interface IProps {
  form: UseFormReturn<TEmployeeSchema>
  /** photo already saved (edit); undefined once removed */
  currentImageUrl?: string | null
  onRemoveCurrentImage: () => void
}

export function StepPersonal({ form, currentImageUrl, onRemoveCurrentImage }: IProps) {
  const { t } = useTranslation()
  const { control } = form

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <EmployeeFormSection title={t('employee.section.basic')}>
        <FormInputField
          control={control}
          name={EEmployeeFormKey.FullName}
          label={t('employee.field.full_name')}
          required
        />
        <FormDateField
          control={control}
          name={EEmployeeFormKey.DateOfBirth}
          label={t('employee.field.date_of_birth')}
        />
        <FormSelectField
          control={control}
          name={EEmployeeFormKey.Gender}
          label={t('employee.field.gender')}
          options={[{ label: t('employee.none'), value: '' }, ...DATA.GET_GENDER_OPTIONS(t)]}
        />
        <FormInputField
          control={control}
          name={EEmployeeFormKey.Phone}
          label={t('employee.field.phone')}
          inputMode='tel'
        />
      </EmployeeFormSection>

      <EmployeeFormSection title={t('employee.section.photo')}>
        <div className='flex items-start gap-4 sm:col-span-2 lg:col-span-3'>
          {currentImageUrl && (
            <div className='flex flex-col items-center gap-1'>
              <Avatar name={form.getValues(EEmployeeFormKey.FullName)} src={currentImageUrl} size='lg' />
              <Button type='button' variant='ghost' size='sm' onClick={onRemoveCurrentImage}>
                <X />
                {t('employee.photo.remove')}
              </Button>
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <Controller
              name={EEmployeeFormKey.ProfileImage}
              control={control}
              render={({ field }) => (
                <UploadFile
                  value={field.value ? [field.value] : []}
                  // single file: null (not undefined) clears the RHF value
                  onChange={(files) => field.onChange(files[0] ?? null)}
                  accept='image/png,image/jpeg,image/gif,image/webp'
                  maxFileSizeBytes={MAX_PROFILE_IMAGE_BYTES}
                  maxFileSizeExceeded={t('upload.too_large', { size: '2 MB' })}
                  title={t(currentImageUrl ? 'employee.photo.replace' : 'employee.photo.upload')}
                  description={t('employee.photo.hint')}
                />
              )}
            />
          </div>
        </div>
      </EmployeeFormSection>

      <EmployeeFormSection title={t('employee.section.address')}>
        <FormInputField
          control={control}
          name={EEmployeeFormKey.AddressLine1}
          label={t('employee.field.address_line1')}
        />
        <FormInputField
          control={control}
          name={EEmployeeFormKey.AddressLine2}
          label={t('employee.field.address_line2')}
        />
        <FormInputField control={control} name={EEmployeeFormKey.City} label={t('employee.field.city')} />
        <FormInputField control={control} name={EEmployeeFormKey.State} label={t('employee.field.state')} />
        <FormInputField control={control} name={EEmployeeFormKey.Country} label={t('employee.field.country')} />
        <FormInputField control={control} name={EEmployeeFormKey.PostalCode} label={t('employee.field.postal_code')} />
      </EmployeeFormSection>

      <EmployeeFormSection title={t('employee.section.emergency')}>
        <FormInputField
          control={control}
          name={EEmployeeFormKey.EmergencyName}
          label={t('employee.field.emergency_name')}
        />
        <FormInputField
          control={control}
          name={EEmployeeFormKey.EmergencyRelationship}
          label={t('employee.field.emergency_relationship')}
        />
        <FormInputField
          control={control}
          name={EEmployeeFormKey.EmergencyPhone}
          label={t('employee.field.emergency_phone')}
          inputMode='tel'
        />
      </EmployeeFormSection>
    </div>
  )
}
