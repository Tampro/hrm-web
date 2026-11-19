import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetHolidayDetailApi } from '~/hooks/apis/use-holiday-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { DATA } from '~/shared/constants/data.constant'

interface IProps {
  holidayId: string | undefined
  onClose: () => void
}

/** Manual 6.3.4 View. Spec: GET /org/holidays/{id} (EMP_032 when missing) */
export function HolidayDetailSheet({ holidayId: idProp, onClose }: IProps) {
  const { t } = useTranslation()
  const holidayId = useLastDefined(idProp)
  const { detail, isLoading } = useGetHolidayDetailApi({ id: holidayId })

  return (
    <Sheet open={!!idProp} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{t('holiday.detail.title')}</SheetTitle>
          <SheetDescription>{detail?.name || '-'}</SheetDescription>
        </SheetHeader>
        <div className='px-4 pb-6'>
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className='h-5 w-full' />
              ))}
            </div>
          ) : (
            <InfoRows rows={DATA.GET_HOLIDAY_DETAIL_ROWS(t, detail)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
