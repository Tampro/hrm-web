import type { ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { ITabOption } from '~/shared/models/common.model'

interface IProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  options: ITabOption[]
  description?: ReactNode
  disabled?: boolean
}

/** RHF select (Base UI): label, 38px trigger showing the option label, field error */
export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  disabled
}: IProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select
            items={options}
            value={field.value ?? null}
            onValueChange={(value) => value !== null && field.onChange(value)}
            disabled={disabled}
          >
            <SelectTrigger id={field.name} className='h-[38px] w-full' aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
