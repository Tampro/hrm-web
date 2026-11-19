import type { ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'

interface IProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  required?: boolean
}

/** RHF day picker; the value is the backend day format YYYY-MM-DD or '' */
export function FormDateField<T extends FieldValues>({ control, name, label, description, required }: IProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {required && (
              <span aria-hidden className='text-destructive'>
                *
              </span>
            )}
          </FieldLabel>
          <DatePickerCustom
            id={field.name}
            value={field.value ?? ''}
            onChange={(value) => {
              field.onChange(value)
              field.onBlur()
            }}
            isInvalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
