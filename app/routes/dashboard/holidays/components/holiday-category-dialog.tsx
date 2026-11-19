import { useTranslation } from 'react-i18next'

import { ColorCategoryDialog } from '~/components/common/color-category-dialog'
import { getHolidayCategoryName } from '~/helpers/columns/holiday-mgt-column'
import { useHolidayCategoriesApi, useInvalidateHolidays } from '~/hooks/apis/use-holiday-api'
import { HolidayService } from '~/services/holiday.service'

interface IProps {
  open: boolean
  companyId?: string
  onClose: () => void
}

// Spec: GET / POST /org/holiday-categories, PUT / DELETE /{id} — the 4 system categories are read-only (EMP_035),
// a category used by a holiday cannot be deleted (EMP_010)
export function HolidayCategoryDialog({ open, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateHolidays()
  const { data: categories = [] } = useHolidayCategoriesApi(companyId, open)

  return (
    <ColorCategoryDialog
      open={open}
      onClose={onClose}
      title={t('holiday.category.title')}
      description={t('holiday.category.description')}
      categories={categories}
      getName={(c) => getHolidayCategoryName(t, c)}
      onCreate={(values) => HolidayService.CreateCategory(companyId, values)}
      onUpdate={(id, values) => HolidayService.UpdateCategory(id, values)}
      onDelete={(id) => HolidayService.DeleteCategory(id)}
      onChanged={invalidate}
    />
  )
}
