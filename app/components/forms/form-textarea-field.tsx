import type { ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Textarea } from '~/components/ui/textarea'

interface IProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  rows?: number
}

/** RHF textarea; wraps long unbroken text so it never widens its dialog / card */
export function FormTextareaField<T extends FieldValues>({ control, name, label, description, rows = 3 }: IProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Textarea
            {...field}
            value={field.value ?? ''}
            id={field.name}
            rows={rows}
            aria-invalid={fieldState.invalid}
            className='max-h-72 [overflow-wrap:anywhere]'
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
