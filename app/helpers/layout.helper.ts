import type { TFunction } from 'i18next'

import { DATA } from '~/shared/constants/data.constant'
import type { IMe } from '~/shared/models/auth.model'

export const layoutHelper = {
  /** Sidebar entries the current user may see (UX only — the backend enforces access) */
  getSidebarItems: (t: TFunction, me?: IMe) =>
    DATA.GET_SIDEBAR_ITEMS(t).filter(
      (item) =>
        (!item.superAdminOnly || !!me?.superAdmin) &&
        (!item.permission || !!me?.superAdmin || !!me?.permissions?.includes(item.permission))
    )
}
