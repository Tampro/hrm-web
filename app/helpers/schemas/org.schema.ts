import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, requiredText } from '~/helpers/schema.helper'
import { EBranchFormKey } from '~/shared/enums/form.enum'

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

// Spec: employee-service BranchForm — name required ≤ 150 (unique in the company, EMP_011), optional email @Email
export const getBranchSchema = (t?: TFunction) =>
  z.object({
    [EBranchFormKey.Name]: requiredText(150, t),
    [EBranchFormKey.Address]: text(255, t),
    [EBranchFormKey.City]: text(100, t),
    [EBranchFormKey.State]: text(100, t),
    [EBranchFormKey.Country]: text(100, t),
    [EBranchFormKey.PostalCode]: text(20, t),
    [EBranchFormKey.Phone]: text(30, t).regex(/^[0-9+\-\s().]*$/, t?.('validation.phone')),
    [EBranchFormKey.Email]: text(255, t).refine((v) => v === '' || z.email().safeParse(v).success, {
      message: t?.('validation.email')
    }),
    [EBranchFormKey.Active]: z.boolean()
  })

export type TBranchSchema = z.infer<ReturnType<typeof getBranchSchema>>
