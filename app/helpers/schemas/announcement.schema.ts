import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, required, requiredText } from '~/helpers/schema.helper'
import { EAnnouncementFilterFormKey, EAnnouncementFormKey } from '~/shared/enums/form.enum'

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

/** Spec: AnnouncementForm.attachmentIds @Size(max = 10) */
export const MAX_ANNOUNCEMENT_ATTACHMENTS = 10

/** An attachment of the form: already in the media library (fileId) or a new file to upload */
export type TAnnouncementAttachmentItem = { fileId?: string; name: string; file?: File }

// Spec: AnnouncementForm — title ≤ 200, category, content (HTML, ≤ 100 000) required, short description ≤ 500,
// end ≥ start (EMP_034), ≤ 10 attachments, companyWide or at least one branch / department (EMP_040)
export const getAnnouncementSchema = (t?: TFunction) =>
  z
    .object({
      [EAnnouncementFormKey.Title]: requiredText(200, t),
      [EAnnouncementFormKey.CategoryId]: z.string().min(1, required(t)),
      [EAnnouncementFormKey.ShortDescription]: text(500, t),
      [EAnnouncementFormKey.Content]: requiredText(100_000, t),
      [EAnnouncementFormKey.StartDate]: z.string().min(1, required(t)),
      [EAnnouncementFormKey.EndDate]: z.string().min(1, required(t)),
      [EAnnouncementFormKey.Files]: z
        .array(z.custom<TAnnouncementAttachmentItem>())
        .max(
          MAX_ANNOUNCEMENT_ATTACHMENTS,
          t?.('announcement.validation.too_many_files', { max: MAX_ANNOUNCEMENT_ATTACHMENTS })
        ),
      [EAnnouncementFormKey.Featured]: z.boolean(),
      [EAnnouncementFormKey.HighPriority]: z.boolean(),
      [EAnnouncementFormKey.CompanyWide]: z.boolean(),
      [EAnnouncementFormKey.BranchIds]: z.array(z.string()).max(200),
      [EAnnouncementFormKey.DepartmentIds]: z.array(z.string()).max(500)
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: [EAnnouncementFormKey.EndDate],
      message: t?.('holiday.validation.end_before_start')
    })
    .refine((v) => v.companyWide || v.branchIds.length > 0 || v.departmentIds.length > 0, {
      path: [EAnnouncementFormKey.CompanyWide],
      message: t?.('announcement.validation.no_audience')
    })

export type TAnnouncementSchema = z.infer<ReturnType<typeof getAnnouncementSchema>>

// Spec: list filters — keyword, categoryId, branchId, departmentId, dateFrom / dateTo
export const getAnnouncementFilterSchema = (t?: TFunction) =>
  z
    .object({
      [EAnnouncementFilterFormKey.Keyword]: text(255, t),
      [EAnnouncementFilterFormKey.CategoryId]: z.string(),
      [EAnnouncementFilterFormKey.BranchId]: z.string(),
      [EAnnouncementFilterFormKey.DepartmentId]: z.string(),
      [EAnnouncementFilterFormKey.DateFrom]: z.string(),
      [EAnnouncementFilterFormKey.DateTo]: z.string()
    })
    .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
      path: [EAnnouncementFilterFormKey.DateTo],
      message: t?.('validation.date_range')
    })

export type TAnnouncementFilterSchema = z.infer<ReturnType<typeof getAnnouncementFilterSchema>>
