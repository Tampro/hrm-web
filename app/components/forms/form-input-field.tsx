import type { ComponentProps, ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface IProps<T extends FieldValues> extends Omit<ComponentProps<typeof Input>, 'name' | 'form'> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  required?: boolean
  /** Trailing element inside the input (e.g. show-password button) */
  suffix?: ReactNode
}

/** RHF text input: label, 38px input, field error */
export function FormInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  suffix,
  className,
  ...inputProps
}: IProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {/* visual marker only; the input carries aria-required */}
            {required && (
              <span className='text-destructive' aria-hidden='true'>
                *
              </span>
            )}
          </FieldLabel>
          <div className='relative'>
            <Input
              {...inputProps}
              {...field}
              value={field.value ?? ''}
              id={field.name}
              aria-required={required || undefined}
              aria-invalid={fieldState.invalid}
              className={cn('h-[38px]', suffix && 'pr-10', className)}
            />
            {suffix && <div className='absolute top-1/2 right-1 -translate-y-1/2'>{suffix}</div>}
          </div>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
