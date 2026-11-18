import type { ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { Field, FieldContent, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Switch } from '~/components/ui/switch'

interface IProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

/** RHF boolean switch with label + description */
export function FormSwitchField<T extends FieldValues>({ control, name, label, description, disabled }: IProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field orientation='horizontal' data-disabled={disabled || undefined}>
          <FieldContent>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </FieldContent>
          <Switch id={field.name} checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} />
        </Field>
      )}
    />
  )
}
