import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getResetPasswordSchema, type TResetPasswordSchema } from '~/helpers/schema.helper'
import { useGetCompanyInfoApi } from '~/hooks/apis/use-company-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { CompanyService } from '~/services/company.service'
import { EResetPasswordFormKey } from '~/shared/enums/form.enum'
import type { ICompany } from '~/shared/models/company.model'

const DEFAULT_VALUES: TResetPasswordSchema = {
  [EResetPasswordFormKey.UserId]: '',
  [EResetPasswordFormKey.NewPassword]: ''
}

interface IProps {
  company: ICompany | undefined
  onClose: () => void
}

/**
 * Spec: POST /iam/companies/{id}/reset-password — sets a permanent password for an account of the company
 * (default: its first active COMPANY_ADMIN) and ends that account's sessions. Accounts come from GET /{id}/info.
 */
export function ResetPasswordDialog({ company: companyProp, onClose }: IProps) {
  const company = useLastDefined(companyProp)
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const { detail: info, isLoading } = useGetCompanyInfoApi({ id: company?.id })
  const admins = info?.administrators ?? []

  const form = useForm<TResetPasswordSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getResetPasswordSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (!companyProp) form.reset(DEFAULT_VALUES)
  }, [companyProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TResetPasswordSchema) =>
      CompanyService.ResetPassword(company?.id ?? '', {
        // empty = backend default (first active COMPANY_ADMIN)
        userId: values.userId ? Number(values.userId) : undefined,
        newPassword: values.newPassword
      }),
    onSuccess: (res) => {
      toast.success(t('company.toast.password_reset', { username: res?.data?.username ?? '-' }))
      onClose()
    }
  })

  const adminItems = [
    { value: '', label: t('company.reset_password.default_admin') },
    ...admins.map((admin) => ({ value: admin.id ?? '', label: `${admin.fullName || '-'} (${admin.username || '-'})` }))
  ]

  return (
    <Dialog open={!!companyProp} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('company.reset_password.title')}</DialogTitle>
          <DialogDescription>
            {t('company.reset_password.description', { name: company?.name ?? '-' })}
          </DialogDescription>
        </DialogHeader>
        <form id='reset-password-form' onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
          <FieldGroup>
            <Controller
              name={EResetPasswordFormKey.UserId}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='reset-password-user'>{t('company.reset_password.account')}</FieldLabel>
                  <Select
                    items={adminItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id='reset-password-user' className='h-[38px] w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {adminItems.map((item) => (
                        <SelectItem key={item.value || 'default'} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>{t('company.reset_password.account_hint')}</FieldDescription>
                </Field>
              )}
            />
            <FormInputField
              control={form.control}
              name={EResetPasswordFormKey.NewPassword}
              label={t('company.reset_password.new_password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              required
              suffix={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t(showPassword ? 'auth.login.hide_password' : 'auth.login.show_password')}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              }
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='reset-password-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
