import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { FieldGroup, FieldSeparator } from '~/components/ui/field'
import { getCompanyCreateSchema, type TCompanyCreateSchema } from '~/helpers/schema.helper'
import { useInvalidateCompanies } from '~/hooks/apis/use-company-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { CompanyService } from '~/services/company.service'
import { ECompanyFormKey } from '~/shared/enums/form.enum'
import type { ICompanyCreated } from '~/shared/models/company.model'

const DEFAULT_VALUES: TCompanyCreateSchema = {
  [ECompanyFormKey.Code]: '',
  [ECompanyFormKey.Name]: '',
  [ECompanyFormKey.Email]: '',
  [ECompanyFormKey.EnableLogin]: true,
  [ECompanyFormKey.AdminUsername]: '',
  [ECompanyFormKey.AdminEmail]: '',
  [ECompanyFormKey.AdminFullName]: ''
}

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Receives the created company + the admin's temporary password (shown once) */
  onCreated: (created: ICompanyCreated | undefined) => void
}

export function CreateCompanyDialog({ open, onOpenChange, onCreated }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateCompanies()
  const form = useForm<TCompanyCreateSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getCompanyCreateSchema(t)),
    mode: 'all'
  })

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TCompanyCreateSchema) =>
      CompanyService.Create({
        code: values.code,
        name: values.name,
        email: values.email,
        enableLogin: values.enableLogin,
        admin: { username: values.adminUsername, email: values.adminEmail, fullName: values.adminFullName }
      }),
    onSuccess: async (res) => {
      toast.success(t('company.toast.created'))
      await invalidate()
      form.reset(DEFAULT_VALUES)
      onOpenChange(false)
      onCreated(res?.data)
    }
  })

  const handleOpenChange = (next: boolean) => {
    if (isPending) return
    if (!next) form.reset(DEFAULT_VALUES)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('company.create.title')}</DialogTitle>
          <DialogDescription>{t('company.create.description')}</DialogDescription>
        </DialogHeader>
        <form id='create-company-form' onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
          <FieldGroup className='max-h-[60vh] overflow-y-auto pr-1'>
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.Code}
              label={t('company.field.code')}
              description={t('company.create.code_hint')}
              placeholder='ACME'
              required
              autoFocus
            />
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.Name}
              label={t('company.field.name')}
              required
            />
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.Email}
              label={t('company.field.email')}
              type='email'
              required
            />
            <FormSwitchField
              control={form.control}
              name={ECompanyFormKey.EnableLogin}
              label={t('company.field.enable_login')}
              description={t('company.create.enable_login_hint')}
            />
            <FieldSeparator>{t('company.create.admin_section')}</FieldSeparator>
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.AdminUsername}
              label={t('company.field.admin_username')}
              autoComplete='off'
              required
            />
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.AdminFullName}
              label={t('company.field.admin_full_name')}
              required
            />
            <FormInputField
              control={form.control}
              name={ECompanyFormKey.AdminEmail}
              label={t('company.field.admin_email')}
              type='email'
              required
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='create-company-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t('company.create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
