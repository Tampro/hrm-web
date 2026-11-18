import { redirect } from 'react-router'

import { ROUTES } from '~/shared/constants/routes.constant'
import { ESettingsSection } from '~/shared/enums/settings.enum'

/** /dashboard/settings opens the first section */
export const clientLoader = () => redirect(ROUTES.SETTINGS_SECTION(ESettingsSection.System))

export default function SettingsIndex() {
  return null
}
