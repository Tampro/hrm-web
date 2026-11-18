import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { getLoginSchema, type TLoginSchema } from '~/helpers/schema.helper'
import { useLogin } from '~/hooks/use-auth'
import { ELoginFormKey } from '~/shared/enums/form.enum'

const DEFAULT_VALUES: TLoginSchema = { [ELoginFormKey.Username]: '', [ELoginFormKey.Password]: '' }

export function meta() {
  return [{ title: 'SPECOM HRM' }]
}

export default function LoginPage() {
  // Lib
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)

  // Form
  const form = useForm<TLoginSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getLoginSchema(t)),
    mode: 'all'
  })

  // API
  const { mutate: login, isPending } = useLogin()

  // Submit
  const handleSubmit = form.handleSubmit((values) => login(values))

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle className='text-xl'>{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Controller
              name={ELoginFormKey.Username}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t('auth.login.username')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    autoComplete='username'
                    autoFocus
                    className='h-[38px]'
                    placeholder={t('auth.login.username_placeholder')}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={ELoginFormKey.Password}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t('auth.login.password')}</FieldLabel>
                  <div className='relative'>
                    <Input
                      {...field}
                      id={field.name}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='current-password'
                      className='h-[38px] pr-10'
                      placeholder={t('auth.login.password_placeholder')}
                      aria-invalid={fieldState.invalid}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      className='absolute top-1/2 right-1 -translate-y-1/2'
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={t(showPassword ? 'auth.login.hide_password' : 'auth.login.show_password')}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button type='submit' className='h-[38px] w-full' disabled={isPending}>
              {isPending ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
