import { useTranslation } from 'react-i18next'

import { ColorCategoryDialog } from '~/components/common/color-category-dialog'
import { getAnnouncementCategoryName } from '~/helpers/columns/announcement-mgt-column'
import { useAnnouncementCategoriesApi, useInvalidateAnnouncements } from '~/hooks/apis/use-announcement-api'
import { AnnouncementService } from '~/services/announcement.service'

interface IProps {
  open: boolean
  companyId?: string
  onClose: () => void
}

// Spec: GET / POST /org/announcement-categories, PUT / DELETE /{id} — system categories read-only (EMP_039),
// a category used by an announcement cannot be deleted (EMP_010)
export function AnnouncementCategoryDialog({ open, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAnnouncements()
  const { data: categories = [] } = useAnnouncementCategoriesApi(companyId, open)

  return (
    <ColorCategoryDialog
      open={open}
      onClose={onClose}
      title={t('announcement.category.title')}
      description={t('announcement.category.description')}
      categories={categories}
      getName={(c) => getAnnouncementCategoryName(t, c)}
      onCreate={(values) => AnnouncementService.CreateCategory(companyId, values)}
      onUpdate={(id, values) => AnnouncementService.UpdateCategory(id, values)}
      onDelete={(id) => AnnouncementService.DeleteCategory(id)}
      onChanged={invalidate}
    />
  )
}
