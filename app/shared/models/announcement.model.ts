import type { EAnnouncementState, EAnnouncementTab } from '~/shared/enums/announcement.enum'

import type { IBaseFilterPanel, IBasePagination } from './common.model'

// Spec: employee-service AnnouncementDtos. Every field optional: the backend may return null.

export interface IAnnouncementRef {
  id?: string
  name?: string | null
}

/** CategoryDto — system = shared by every company, read-only; color = tag colour #RRGGBB */
export interface IAnnouncementCategory {
  id?: string
  name?: string
  color?: string
  system?: boolean
}

/** AttachmentDto — viewUrl / downloadUrl are signed links (10 min), null without MEDIA_VIEW or when the file is gone */
export interface IAnnouncementAttachment {
  fileId?: string
  name?: string
  mimeType?: string
  sizeBytes?: number
  viewUrl?: string | null
  downloadUrl?: string | null
}

/** Stats — viewRate in percent (one decimal), 0 when the audience is empty */
export interface IAnnouncementStats {
  totalEmployees?: number
  views?: number
  viewRate?: number
}

/**
 * AnnouncementDto — list row, dashboard card and detail. content, attachment links and stats are filled on the
 * detail only; contentPreview is plain text for the dashboard cards.
 */
export interface IAnnouncement {
  id?: string
  companyId?: string
  title?: string
  category?: IAnnouncementCategory | null
  shortDescription?: string | null
  contentPreview?: string | null
  content?: string | null
  startDate?: string
  endDate?: string
  state?: EAnnouncementState
  featured?: boolean
  highPriority?: boolean
  companyWide?: boolean
  branches?: IAnnouncementRef[]
  departments?: IAnnouncementRef[]
  attachments?: IAnnouncementAttachment[]
  stats?: IAnnouncementStats | null
  createdDate?: string
  updatedDate?: string | null
}

export interface IAnnouncementTabCounts {
  all?: number
  highPriority?: number
  featured?: number
  upcoming?: number
}

export interface IAnnouncementListParams extends IBasePagination, IBaseFilterPanel {
  companyId?: string
  categoryId?: string
  branchId?: string
  departmentId?: string
  dateFrom?: string
  dateTo?: string
  tab?: EAnnouncementTab
}

/** AnnouncementForm — full replacement on update: omitted lists cleared, omitted flags false */
export interface IAnnouncementPayload {
  title: string
  categoryId: number
  shortDescription?: string
  content: string
  startDate: string
  endDate: string
  attachmentIds?: number[]
  featured: boolean
  highPriority: boolean
  companyWide: boolean
  branchIds?: number[]
  departmentIds?: number[]
}

export interface IAnnouncementCategoryPayload {
  name: string
  color: string
}
