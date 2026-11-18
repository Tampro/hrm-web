import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetAdminCurrencyDetailApi } from '~/hooks/apis/use-currency-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { DATA } from '~/shared/constants/data.constant'

interface IProps {
  currencyId: string | undefined
  onClose: () => void
}

/** Manual 3.2.5 View. Spec: GET /saas/admin/currencies/{id} (SAAS_022 when missing) */
export function CurrencyDetailSheet({ currencyId: idProp, onClose }: IProps) {
  const { t } = useTranslation()
  const currencyId = useLastDefined(idProp)
  const { detail, isLoading } = useGetAdminCurrencyDetailApi({ id: currencyId })

  return (
    <Sheet open={!!idProp} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{t('currency.detail.title')}</SheetTitle>
          <SheetDescription>{detail?.code || '-'}</SheetDescription>
        </SheetHeader>
        <div className='px-4 pb-6'>
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className='h-5 w-full' />
              ))}
            </div>
          ) : (
            <InfoRows rows={DATA.GET_CURRENCY_DETAIL_ROWS(t, detail)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
