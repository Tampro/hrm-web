import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { FieldGroup } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { getCompanyUpdateSchema, type TCompanyUpdateSchema } from '~/helpers/schema.helper'
import { useInvalidateCompanies } from '~/hooks/apis/use-company-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { CompanyService } from '~/services/company.service'
import { ECompanyFormKey } from '~/shared/enums/form.enum'
import type { ICompany } from '~/shared/models/company.model'

interface IProps {
  company: ICompany | undefined
  onClose: () => void
}

/** Spec: PUT /iam/companies/{id} — full replacement of name and email; code is fixed */
export function EditCompanyDialog({ company: companyProp, onClose }: IProps) {
  const company = useLastDefined(companyProp)
  const { t } = useTranslation()
  const invalidate = useInvalidateCompanies()
  const form = useForm<TCompanyUpdateSchema>({
    defaultValues: { [ECompanyFormKey.Name]: '', [ECompanyFormKey.Email]: '' },
    resolver: zodResolver(getCompanyUpdateSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (companyProp) form.reset({ name: companyProp.name ?? '', email: companyProp.email ?? '' })
  }, [companyProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TCompanyUpdateSchema) => CompanyService.Update(company?.id ?? '', values),
    onSuccess: async () => {
      toast.success(t('company.toast.updated'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={!!companyProp} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('company.edit.title')}</DialogTitle>
          <DialogDescription>{t('company.edit.description')}</DialogDescription>
        </DialogHeader>
        <form id='edit-company-form' onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
          <FieldGroup>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='company-code'>{t('company.field.code')}</Label>
              <Input id='company-code' value={company?.code ?? ''} disabled className='h-[38px]' />
            </div>
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
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='edit-company-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
