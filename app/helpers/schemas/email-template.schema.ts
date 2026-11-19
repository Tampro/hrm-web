import type { TFunction } from 'i18next'
import { z } from 'zod'

import { requiredText } from '~/helpers/schema.helper'
import { EEmailTemplateContentFormKey, EEmailTemplateSettingsFormKey } from '~/shared/enums/form.enum'

// Spec: EmailTemplateService.FromNameForm — @NotBlank @Size(max = 100)
export const getEmailTemplateSettingsSchema = (t?: TFunction) =>
  z.object({ [EEmailTemplateSettingsFormKey.FromName]: requiredText(100, t) })

export type TEmailTemplateSettingsSchema = z.infer<ReturnType<typeof getEmailTemplateSettingsSchema>>

// Spec: ContentForm — subject @NotBlank ≤ 255, content (HTML) @NotBlank ≤ 60000
export const getEmailTemplateContentSchema = (t?: TFunction) =>
  z.object({
    [EEmailTemplateContentFormKey.Subject]: requiredText(255, t),
    [EEmailTemplateContentFormKey.Content]: requiredText(60000, t)
  })

export type TEmailTemplateContentSchema = z.infer<ReturnType<typeof getEmailTemplateContentSchema>>
