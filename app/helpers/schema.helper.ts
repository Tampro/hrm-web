import type { TFunction } from 'i18next'
import { z } from 'zod'

import { EBillingCycle } from '~/shared/enums/company.enum'
import { ECouponCodeGeneration, ECouponType } from '~/shared/enums/coupon.enum'
import {
  ECompanyFilterFormKey,
  ECompanyFormKey,
  ECouponFilterFormKey,
  ECouponFormKey,
  EKeywordFilterFormKey,
  ECurrencyFormKey,
  EDecisionFormKey,
  ELoginFormKey,
  EPlanFormKey,
  EReferralSettingsFormKey,
  EResetPasswordFormKey,
  ESaasFilterFormKey,
  EUpgradePlanFormKey,
  EColorCategoryFormKey
} from '~/shared/enums/form.enum'

export const required = (t?: TFunction) => t?.('validation.required')
export const maxLength = (max: number, t?: TFunction) => t?.('validation.max_length', { max })

export const requiredText = (max: number, t?: TFunction) =>
  z.string().trim().min(1, required(t)).max(max, maxLength(max, t))

export const requiredEmail = (max: number, t?: TFunction) => requiredText(max, t).pipe(z.email(t?.('validation.email')))

// Spec: LoginForm — username ≤ 100, password ≤ 128, both required
export const getLoginSchema = (t?: TFunction) =>
  z.object({
    [ELoginFormKey.Username]: requiredText(100, t),
    [ELoginFormKey.Password]: z.string().min(1, required(t)).max(128, maxLength(128, t))
  })

export type TLoginSchema = z.infer<ReturnType<typeof getLoginSchema>>

// Spec: GET /iam/companies — keyword (name, code or email), createdFrom/createdTo YYYY-MM-DD inclusive
export const getCompanyFilterSchema = (t?: TFunction) =>
  z
    .object({
      [ECompanyFilterFormKey.Keyword]: z.string().trim().max(255, maxLength(255, t)),
      [ECompanyFilterFormKey.CreatedFrom]: z.string(),
      [ECompanyFilterFormKey.CreatedTo]: z.string()
    })
    .refine((v) => !v.createdFrom || !v.createdTo || v.createdFrom <= v.createdTo, {
      path: [ECompanyFilterFormKey.CreatedTo],
      message: t?.('validation.date_range')
    })

export type TCompanyFilterSchema = z.infer<ReturnType<typeof getCompanyFilterSchema>>

// Spec: CompanyCreateForm + AdminForm (hrm-be CompanyDtos.java: @NotBlank, @Email, @Size, @Pattern)
export const getCompanyCreateSchema = (t?: TFunction) =>
  z.object({
    [ECompanyFormKey.Code]: requiredText(50, t).regex(/^[A-Z0-9_]+$/, t?.('validation.company_code')),
    [ECompanyFormKey.Name]: requiredText(255, t),
    [ECompanyFormKey.Email]: requiredEmail(255, t),
    [ECompanyFormKey.EnableLogin]: z.boolean(),
    [ECompanyFormKey.AdminUsername]: requiredText(100, t)
      .min(3, t?.('validation.min_length', { min: 3 }))
      .regex(/^[a-zA-Z0-9._-]+$/, t?.('validation.username')),
    [ECompanyFormKey.AdminEmail]: requiredEmail(255, t),
    [ECompanyFormKey.AdminFullName]: requiredText(255, t)
  })

export type TCompanyCreateSchema = z.infer<ReturnType<typeof getCompanyCreateSchema>>

// Spec: CompanyUpdateForm — name ≤ 255, email ≤ 255
export const getCompanyUpdateSchema = (t?: TFunction) =>
  z.object({
    [ECompanyFormKey.Name]: requiredText(255, t),
    [ECompanyFormKey.Email]: requiredEmail(255, t)
  })

export type TCompanyUpdateSchema = z.infer<ReturnType<typeof getCompanyUpdateSchema>>

// Spec: ResetPasswordForm — newPassword @Size(min = 10, max = 128) (Swagger omits the min); userId optional
export const getResetPasswordSchema = (t?: TFunction) =>
  z.object({
    [EResetPasswordFormKey.UserId]: z.string(),
    [EResetPasswordFormKey.NewPassword]: z
      .string()
      .min(1, required(t))
      .min(10, t?.('validation.min_length', { min: 10 }))
      .max(128, maxLength(128, t))
  })

export type TResetPasswordSchema = z.infer<ReturnType<typeof getResetPasswordSchema>>

// Spec: UpgradePlanForm — planId and billingCycle required
export const getUpgradePlanSchema = (t?: TFunction) =>
  z.object({
    [EUpgradePlanFormKey.PlanId]: z.string().min(1, required(t)),
    [EUpgradePlanFormKey.BillingCycle]: z.enum(EBillingCycle)
  })

export type TUpgradePlanSchema = z.infer<ReturnType<typeof getUpgradePlanSchema>>

/**
 * Number typed in a text input. Empty = not set (allowed unless `required`).
 * `integer` rejects decimals; `min` is inclusive (backend @Min / @DecimalMin).
 */
export const numberText = (t: TFunction | undefined, { required: isRequired = false, min = 0, integer = false } = {}) =>
  z
    .string()
    .trim()
    .refine((v) => !isRequired || v !== '', { message: required(t) })
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number.isFinite(Number(v))), {
      message: t?.('validation.number')
    })
    .refine((v) => v === '' || Number.isNaN(Number(v)) || !integer || Number.isInteger(Number(v)), {
      message: t?.('validation.integer')
    })
    .refine((v) => v === '' || Number.isNaN(Number(v)) || Number(v) >= min, {
      message: t?.('validation.min_value', { min })
    })

// Spec: PlanForm (hrm-be SaasDtos.java): code @Pattern [A-Z][A-Z0-9_]* ≤50, name ≤100, description ≤255,
// monthlyPrice @NotNull ≥0, yearlyPrice ≥0 (omit = no yearly billing), maxUsers / maxEmployees @Min(1) (omit = unlimited),
// storageLimitGb ≥0 (omit = unlimited), trialDays @Min(0)
export const getPlanSchema = (t?: TFunction) =>
  z
    .object({
      [EPlanFormKey.Code]: requiredText(50, t).regex(/^[A-Z][A-Z0-9_]*$/, t?.('validation.plan_code')),
      [EPlanFormKey.Name]: requiredText(100, t),
      [EPlanFormKey.Description]: z.string().trim().max(255, maxLength(255, t)),
      [EPlanFormKey.MonthlyPrice]: numberText(t, { required: true }),
      [EPlanFormKey.YearlyPrice]: numberText(t),
      [EPlanFormKey.MaxUsers]: numberText(t, { min: 1, integer: true }),
      [EPlanFormKey.MaxEmployees]: numberText(t, { min: 1, integer: true }),
      [EPlanFormKey.StorageLimitGb]: numberText(t),
      [EPlanFormKey.EnableTrial]: z.boolean(),
      [EPlanFormKey.TrialDays]: numberText(t, { integer: true }),
      [EPlanFormKey.AiIntegration]: z.boolean(),
      [EPlanFormKey.Enabled]: z.boolean(),
      [EPlanFormKey.DefaultPlan]: z.boolean()
    })
    // a trial needs a number of days (manual 3.2.3: "Enable Trial" + "Trial Days")
    .refine((v) => !v.enableTrial || (v.trialDays !== '' && Number(v.trialDays) >= 1), {
      path: [EPlanFormKey.TrialDays],
      message: t?.('validation.min_value', { min: 1 })
    })

export type TPlanSchema = z.infer<ReturnType<typeof getPlanSchema>>

// Spec: GET /saas/admin/orders and /plan-requests — keyword; orders also dateFrom/dateTo (YYYY-MM-DD, inclusive)
export const getSaasFilterSchema = (t?: TFunction) =>
  z
    .object({
      [ESaasFilterFormKey.Keyword]: z.string().trim().max(255, maxLength(255, t)),
      [ESaasFilterFormKey.DateFrom]: z.string(),
      [ESaasFilterFormKey.DateTo]: z.string()
    })
    .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
      path: [ESaasFilterFormKey.DateTo],
      message: t?.('validation.date_range')
    })

export type TSaasFilterSchema = z.infer<ReturnType<typeof getSaasFilterSchema>>

// Spec: OrderDecisionForm — notes ≤ 500, optional
// TODO(assumption): a reject reason is not required by the BE; the UI asks for one but allows empty
export const getDecisionSchema = (t?: TFunction) =>
  z.object({
    [EDecisionFormKey.Notes]: z.string().trim().max(500, maxLength(500, t))
  })

export type TDecisionSchema = z.infer<ReturnType<typeof getDecisionSchema>>

// Spec: GET /saas/admin/coupons — keyword (name or code), type, dateFrom/dateTo (creation days, inclusive)
export const getCouponFilterSchema = (t?: TFunction) =>
  z
    .object({
      [ECouponFilterFormKey.Keyword]: z.string().trim().max(255, maxLength(255, t)),
      [ECouponFilterFormKey.Type]: z.enum(ECouponType),
      [ECouponFilterFormKey.DateFrom]: z.string(),
      [ECouponFilterFormKey.DateTo]: z.string()
    })
    .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
      path: [ECouponFilterFormKey.DateTo],
      message: t?.('validation.date_range')
    })

export type TCouponFilterSchema = z.infer<ReturnType<typeof getCouponFilterSchema>>

// Spec: CouponForm (hrm-be CouponDtos.java) — name ≤100, discountValue ≥0 (PERCENTAGE ≤100: SAAS_012),
// code [A-Z0-9_-]+ ≤50 required for MANUAL (SAAS_021), spends ≥0 with min ≤ max (SAAS_020), limits @Min(1),
// expiryDate optional (last valid day)
export const getCouponSchema = (t?: TFunction) =>
  z
    .object({
      [ECouponFormKey.Name]: requiredText(100, t),
      [ECouponFormKey.Type]: z.enum([ECouponType.Percentage, ECouponType.Flat]),
      [ECouponFormKey.DiscountValue]: numberText(t, { required: true }),
      [ECouponFormKey.CodeGeneration]: z.enum(ECouponCodeGeneration),
      [ECouponFormKey.Code]: z
        .string()
        .trim()
        .max(50, maxLength(50, t))
        .refine((v) => v === '' || /^[A-Z0-9_-]+$/.test(v), { message: t?.('validation.coupon_code') }),
      [ECouponFormKey.MinimumSpend]: numberText(t),
      [ECouponFormKey.MaximumSpend]: numberText(t),
      [ECouponFormKey.UseLimitTotal]: numberText(t, { min: 1, integer: true }),
      [ECouponFormKey.UseLimitPerCompany]: numberText(t, { min: 1, integer: true }),
      [ECouponFormKey.ExpiryDate]: z.string()
    })
    .refine((v) => v.type !== ECouponType.Percentage || v.discountValue === '' || Number(v.discountValue) <= 100, {
      path: [ECouponFormKey.DiscountValue],
      message: t?.('validation.percentage_max')
    })
    .refine((v) => v.codeGeneration !== ECouponCodeGeneration.Manual || v.code !== '', {
      path: [ECouponFormKey.Code],
      message: required(t)
    })
    .refine(
      (v) =>
        v.minimumSpend === '' ||
        v.maximumSpend === '' ||
        Number.isNaN(Number(v.minimumSpend)) ||
        Number.isNaN(Number(v.maximumSpend)) ||
        Number(v.minimumSpend) <= Number(v.maximumSpend),
      { path: [ECouponFormKey.MaximumSpend], message: t?.('validation.min_max_spend') }
    )

export type TCouponSchema = z.infer<ReturnType<typeof getCouponSchema>>

// Keyword-only filter (currencies: name, code or symbol; referral pages: company name or email)
export const getKeywordFilterSchema = (t?: TFunction) =>
  z.object({ [EKeywordFilterFormKey.Keyword]: z.string().trim().max(255, maxLength(255, t)) })

export type TKeywordFilterSchema = z.infer<ReturnType<typeof getKeywordFilterSchema>>

// Spec: CurrencyForm (hrm-be CurrencyService.java) — name ≤100, code ISO 4217 [A-Z]{3}, symbol ≤10, description ≤500
export const getCurrencySchema = (t?: TFunction) =>
  z.object({
    [ECurrencyFormKey.Name]: requiredText(100, t),
    [ECurrencyFormKey.Code]: requiredText(3, t).regex(/^[A-Z]{3}$/, t?.('validation.currency_code')),
    [ECurrencyFormKey.Symbol]: z.string().trim().max(10, maxLength(10, t)),
    [ECurrencyFormKey.Description]: z.string().trim().max(500, maxLength(500, t)),
    [ECurrencyFormKey.DefaultCurrency]: z.boolean()
  })

export type TCurrencySchema = z.infer<ReturnType<typeof getCurrencySchema>>

// Spec: ReferralDtos.SettingsForm — commissionPercentage 0–100, thresholdAmount ≥0 (default currency),
// guidelines ≤ 10000 (cleared when omitted)
export const getReferralSettingsSchema = (t?: TFunction) =>
  z
    .object({
      [EReferralSettingsFormKey.Enabled]: z.boolean(),
      [EReferralSettingsFormKey.CommissionPercentage]: numberText(t, { required: true }),
      [EReferralSettingsFormKey.ThresholdAmount]: numberText(t, { required: true }),
      [EReferralSettingsFormKey.Guidelines]: z.string().trim().max(10000, maxLength(10000, t))
    })
    .refine((v) => v.commissionPercentage === '' || Number(v.commissionPercentage) <= 100, {
      path: [EReferralSettingsFormKey.CommissionPercentage],
      message: t?.('validation.percentage_max')
    })

export type TReferralSettingsSchema = z.infer<ReturnType<typeof getReferralSettingsSchema>>

// Spec: CategoryForm of holidays and announcements — name ≤ 100 (unique, EMP_011), colour #RRGGBB
export const getColorCategorySchema = (t?: TFunction) =>
  z.object({
    [EColorCategoryFormKey.Name]: requiredText(100, t),
    [EColorCategoryFormKey.Color]: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t?.('holiday.validation.color'))
  })

export type TColorCategorySchema = z.infer<ReturnType<typeof getColorCategorySchema>>
