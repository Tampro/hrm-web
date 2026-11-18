import type { TFunction } from 'i18next'
import { z } from 'zod'

import { ELoginFormKey } from '~/shared/enums/form.enum'

// Spec: LoginForm — username ≤ 100, password ≤ 128, both required
export const getLoginSchema = (t?: TFunction) =>
  z.object({
    [ELoginFormKey.Username]: z
      .string()
      .trim()
      .min(1, t?.('validation.required'))
      .max(100, t?.('validation.max_length', { max: 100 })),
    [ELoginFormKey.Password]: z
      .string()
      .min(1, t?.('validation.required'))
      .max(128, t?.('validation.max_length', { max: 128 }))
  })

export type TLoginSchema = z.infer<ReturnType<typeof getLoginSchema>>
