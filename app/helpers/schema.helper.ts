import type { TFunction } from 'i18next'
import { z } from 'zod'

import { EBillingCycle } from '~/shared/enums/company.enum'
import {
  ECompanyFilterFormKey,
  ECompanyFormKey,
  ELoginFormKey,
  EResetPasswordFormKey,
  EUpgradePlanFormKey
} from '~/shared/enums/form.enum'

const required = (t?: TFunction) => t?.('validation.required')
const maxLength = (max: number, t?: TFunction) => t?.('validation.max_length', { max })

const requiredText = (max: number, t?: TFunction) => z.string().trim().min(1, required(t)).max(max, maxLength(max, t))

const requiredEmail = (max: number, t?: TFunction) => requiredText(max, t).pipe(z.email(t?.('validation.email')))

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
