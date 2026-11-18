import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
import { FieldGroup } from '~/components/ui/field'
import { getCurrencySchema, type TCurrencySchema } from '~/helpers/schema.helper'
import { useInvalidateCurrencies } from '~/hooks/apis/use-currency-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { CurrencyService } from '~/services/plan.service'
import { ECurrencyFormKey } from '~/shared/enums/form.enum'
import type { ICurrency, ICurrencyPayload } from '~/shared/models/saas.model'

const DEFAULT_VALUES: TCurrencySchema = {
  [ECurrencyFormKey.Name]: '',
  [ECurrencyFormKey.Code]: '',
  [ECurrencyFormKey.Symbol]: '',
  [ECurrencyFormKey.Description]: '',
  [ECurrencyFormKey.DefaultCurrency]: false
}

const toFormValues = (currency: ICurrency): TCurrencySchema => ({
  name: currency.name ?? '',
  code: currency.code ?? '',
  symbol: currency.symbol ?? '',
  description: currency.description ?? '',
  defaultCurrency: !!currency.defaultCurrency
})

// Spec: CurrencyForm — empty symbol / description are omitted (= cleared on update)
const toPayload = (values: TCurrencySchema): ICurrencyPayload => ({
  name: values.name,
  code: values.code,
  symbol: values.symbol || undefined,
  description: values.description || undefined,
  defaultCurrency: values.defaultCurrency
})

interface IProps {
  /** `null` = create, a currency = edit, `undefined` = closed */
  currency: ICurrency | null | undefined
  onClose: () => void
}

/** Manual 3.2.5 Add / Edit currency pop-up. Spec: POST /saas/admin/currencies, PUT /{id} (full replacement) */
export function CurrencyFormDialog({ currency: currencyProp, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateCurrencies()
  const currency = useLastDefined(currencyProp)
  const isOpen = currencyProp !== undefined
  const isEdit = !!currency
  // Spec: SAAS_025 the default can't be un-defaulted — another currency must take the flag
  const isCurrentDefault = !!currency?.defaultCurrency

  const form = useForm<TCurrencySchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getCurrencySchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (currencyProp !== undefined) form.reset(currencyProp ? toFormValues(currencyProp) : DEFAULT_VALUES)
  }, [currencyProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TCurrencySchema) =>
      currency?.id ? CurrencyService.Update(currency.id, toPayload(values)) : CurrencyService.Create(toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'currency.toast.updated' : 'currency.toast.created'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'currency.form.edit_title' : 'currency.form.create_title')}</DialogTitle>
          <DialogDescription>
            {t(isEdit ? 'currency.form.edit_description' : 'currency.form.create_description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id='currency-form'
          className='min-w-0'
          onSubmit={form.handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name={ECurrencyFormKey.Name}
              label={t('currency.field.name')}
              placeholder='US Dollar'
              required
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={ECurrencyFormKey.Code}
                label={t('currency.field.code')}
                description={t('currency.form.code_hint')}
                placeholder='USD'
                maxLength={3}
                required
              />
              <FormInputField
                control={form.control}
                name={ECurrencyFormKey.Symbol}
                label={t('currency.field.symbol')}
                placeholder='$'
              />
            </div>
            <FormInputField
              control={form.control}
              name={ECurrencyFormKey.Description}
              label={t('currency.field.description')}
            />
            <FormSwitchField
              control={form.control}
              name={ECurrencyFormKey.DefaultCurrency}
              label={t('currency.field.set_default')}
              description={t(isCurrentDefault ? 'currency.form.is_default_hint' : 'currency.form.default_hint')}
              disabled={isCurrentDefault}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='currency-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'currency.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
