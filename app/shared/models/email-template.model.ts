import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: hrm-be EmailTemplateService DTOs. Every field optional: the backend may return null.

/** TemplateRow — the name is fixed (seeded per code); only fromName is editable */
export interface IEmailTemplate {
  id?: string
  code?: string
  name?: string
  fromName?: string
  createdDate?: string
  updatedDate?: string | null
}

/** ContentDto — one language; a language without text is absent from the list */
export interface IEmailTemplateContent {
  lang?: string
  subject?: string
  content?: string
  updatedDate?: string | null
}

/** TemplateDetail — editor data; variables are written as {name} in the texts */
export interface IEmailTemplateDetail {
  template?: IEmailTemplate
  contents?: IEmailTemplateContent[]
  variables?: string[]
  toggleableByCompany?: boolean
}

/** Rendered — saved text with sample values ([variable]) */
export interface IEmailTemplatePreview {
  fromName?: string
  subject?: string
  html?: string
}

export interface IEmailTemplateListParams extends IBasePagination, IBaseFilterPanel {}

export interface IEmailTemplateContentPayload {
  subject: string
  content: string
}
