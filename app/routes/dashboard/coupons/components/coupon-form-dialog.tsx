import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DatePickerCustom } from '~/components/customs/date-picker-custom'
import { TabsCustom } from '~/components/customs/tab-custom'
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
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { getCouponSchema, type TCouponSchema } from '~/helpers/schema.helper'
import { useInvalidateCoupons } from '~/hooks/apis/use-coupon-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { CouponService } from '~/services/coupon.service'
import { DATA } from '~/shared/constants/data.constant'
import { ECouponCodeGeneration, ECouponType } from '~/shared/enums/coupon.enum'
import { ECouponFormKey } from '~/shared/enums/form.enum'
import type { ICoupon, ICouponPayload } from '~/shared/models/coupon.model'
import type { ICurrency } from '~/shared/models/saas.model'

const DEFAULT_VALUES: TCouponSchema = {
  [ECouponFormKey.Name]: '',
  [ECouponFormKey.Type]: ECouponType.Percentage,
  [ECouponFormKey.DiscountValue]: '',
  [ECouponFormKey.CodeGeneration]: ECouponCodeGeneration.Manual,
  [ECouponFormKey.Code]: '',
  [ECouponFormKey.MinimumSpend]: '',
  [ECouponFormKey.MaximumSpend]: '',
  [ECouponFormKey.UseLimitTotal]: '',
  [ECouponFormKey.UseLimitPerCompany]: '',
  [ECouponFormKey.ExpiryDate]: ''
}

const toText = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))
const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

const toFormValues = (coupon: ICoupon): TCouponSchema => ({
  name: coupon.name ?? '',
  type: coupon.type ?? ECouponType.Percentage,
  discountValue: toText(coupon.discountValue),
  codeGeneration: coupon.codeGeneration ?? ECouponCodeGeneration.Manual,
  code: coupon.code ?? '',
  minimumSpend: toText(coupon.minimumSpend),
  maximumSpend: toText(coupon.maximumSpend),
  useLimitTotal: toText(coupon.useLimitTotal),
  useLimitPerCompany: toText(coupon.useLimitPerCompany),
  expiryDate: coupon.expiryDate ?? ''
})

// Spec: CouponForm — empty optional fields are omitted (= none / unlimited / no expiry). PUT replaces every field and
// an omitted `enabled` means true, so an edit must send the current value or it would re-activate the coupon.
const toPayload = (values: TCouponSchema, current: ICoupon | null | undefined): ICouponPayload => ({
  name: values.name,
  type: values.type,
  discountValue: Number(values.discountValue),
  codeGeneration: values.codeGeneration,
  code: values.codeGeneration === ECouponCodeGeneration.Manual ? values.code : undefined,
  minimumSpend: toNumber(values.minimumSpend),
  maximumSpend: toNumber(values.maximumSpend),
  useLimitTotal: toNumber(values.useLimitTotal),
  useLimitPerCompany: toNumber(values.useLimitPerCompany),
  expiryDate: values.expiryDate || undefined,
  ...(current && { enabled: !!current.enabled })
})

interface IProps {
  /** `null` = create, a coupon = edit, `undefined` = closed */
  coupon: ICoupon | null | undefined
  currency?: ICurrency
  onClose: () => void
}

/** Manual 3.2.4 Add / Edit coupon pop-up. Spec: POST /saas/admin/coupons, PUT /{id} (full replacement) */
export function CouponFormDialog({ coupon: couponProp, currency, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateCoupons()
  const coupon = useLastDefined(couponProp)
  const isOpen = couponProp !== undefined
  const isEdit = !!coupon
  const typeOptions = DATA.GET_COUPON_TYPE_OPTIONS(t)

  const form = useForm<TCouponSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getCouponSchema(t)),
    mode: 'all'
  })
  const [type, codeGeneration] = useWatch({
    control: form.control,
    name: [ECouponFormKey.Type, ECouponFormKey.CodeGeneration]
  })
  // AUTO on update keeps the current code (Spec) — show it read-only
  const isAutoOnEdit = isEdit && coupon?.codeGeneration === ECouponCodeGeneration.Auto
  const unit = currency?.symbol || currency?.code || ''

  useEffect(() => {
    if (couponProp !== undefined) form.reset(couponProp ? toFormValues(couponProp) : DEFAULT_VALUES)
  }, [couponProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TCouponSchema) =>
      coupon?.id
        ? CouponService.Update(coupon.id, toPayload(values, coupon))
        : CouponService.Create(toPayload(values, null)),
    onSuccess: async (res) => {
      toast.success(isEdit ? t('coupon.toast.updated') : t('coupon.toast.created', { code: res?.data?.code ?? '-' }))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'coupon.form.edit_title' : 'coupon.form.create_title')}</DialogTitle>
          <DialogDescription>
            {t(isEdit ? 'coupon.form.edit_description' : 'coupon.form.create_description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id='coupon-form'
          className='max-h-[65vh] min-w-0 overflow-y-auto pr-1'
          onSubmit={form.handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name={ECouponFormKey.Name}
              label={t('coupon.field.name')}
              placeholder='Summer Sale 2026'
              required
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <Controller
                name={ECouponFormKey.Type}
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='coupon-form-type'>{t('coupon.field.type')}</FieldLabel>
                    <Select
                      items={typeOptions}
                      value={field.value}
                      onValueChange={(value) => {
                        if (!value) return
                        field.onChange(value)
                        void form.trigger(ECouponFormKey.DiscountValue)
                      }}
                    >
                      <SelectTrigger id='coupon-form-type' className='h-[38px] w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <FormInputField
                control={form.control}
                name={ECouponFormKey.DiscountValue}
                label={t('coupon.field.discount_value')}
                description={type === ECouponType.Percentage ? t('coupon.form.percent_hint') : unit}
                inputMode='decimal'
                required
              />
            </div>

            <Controller
              name={ECouponFormKey.CodeGeneration}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t('coupon.field.code_generation')}</FieldLabel>
                  <div>
                    <TabsCustom
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        void form.trigger(ECouponFormKey.Code)
                      }}
                      options={DATA.GET_COUPON_CODE_GENERATION_OPTIONS(t)}
                      isNoSyncParams
                    />
                  </div>
                  {codeGeneration === ECouponCodeGeneration.Auto && !isEdit && (
                    <FieldDescription>{t('coupon.form.auto_hint')}</FieldDescription>
                  )}
                </Field>
              )}
            />
            {codeGeneration === ECouponCodeGeneration.Manual && !isAutoOnEdit && (
              <FormInputField
                control={form.control}
                name={ECouponFormKey.Code}
                label={t('coupon.field.code')}
                description={t('coupon.form.code_hint')}
                placeholder='SUMMER25'
                required
              />
            )}
            {isAutoOnEdit && (
              <div className='flex flex-col gap-2'>
                <FieldLabel htmlFor='coupon-auto-code'>{t('coupon.field.code')}</FieldLabel>
                <Input id='coupon-auto-code' value={coupon?.code ?? ''} disabled className='h-[38px]' />
              </div>
            )}

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={ECouponFormKey.MinimumSpend}
                label={t('coupon.field.minimum_spend')}
                description={t('coupon.form.optional_hint')}
                inputMode='decimal'
              />
              <FormInputField
                control={form.control}
                name={ECouponFormKey.MaximumSpend}
                label={t('coupon.field.maximum_spend')}
                description={t('coupon.form.optional_hint')}
                inputMode='decimal'
              />
              <FormInputField
                control={form.control}
                name={ECouponFormKey.UseLimitTotal}
                label={t('coupon.field.coupon_limit')}
                description={t('coupon.form.unlimited_hint')}
                inputMode='numeric'
              />
              <FormInputField
                control={form.control}
                name={ECouponFormKey.UseLimitPerCompany}
                label={t('coupon.field.user_limit')}
                description={t('coupon.form.unlimited_hint')}
                inputMode='numeric'
              />
            </div>
            <Controller
              name={ECouponFormKey.ExpiryDate}
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='coupon-expiry'>{t('coupon.field.expiry_date')}</FieldLabel>
                  <DatePickerCustom
                    id='coupon-expiry'
                    value={field.value}
                    onChange={field.onChange}
                    className='sm:w-1/2'
                  />
                  <FieldDescription>{t('coupon.form.expiry_hint')}</FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='coupon-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'coupon.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
