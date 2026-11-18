import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetOrderDetailApi } from '~/hooks/apis/use-plan-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { DATA } from '~/shared/constants/data.constant'
import { EPaymentMethod } from '~/shared/enums/saas.enum'
import type { ICurrency } from '~/shared/models/saas.model'

interface IProps {
  orderId: string | undefined
  currency?: ICurrency
  onClose: () => void
}

/** Manual 3.2.3 Plan Orders → View. Spec: GET /saas/admin/orders/{id} (AdminOrderDto) */
export function OrderDetailSheet({ orderId: orderIdProp, currency, onClose }: IProps) {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const orderId = useLastDefined(orderIdProp)
  const { detail, isLoading } = useGetOrderDetailApi({ id: orderId })
  const isBankTransfer = detail?.order?.paymentMethod === EPaymentMethod.BankTransfer

  return (
    <Sheet open={!!orderIdProp} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{t('order.detail.title')}</SheetTitle>
          <SheetDescription>{detail?.order?.orderNumber || '-'}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-6 overflow-y-auto px-4 pb-6'>
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className='h-5 w-full' />
              ))}
            </div>
          ) : (
            <>
              <InfoRows rows={DATA.GET_ORDER_DETAIL_ROWS(t, detail, getTranslateEnum, currency)} />
              {isBankTransfer && (
                <section className='flex flex-col gap-2'>
                  <h3 className='text-sm font-semibold'>{t('order.bank.title')}</h3>
                  <InfoRows rows={DATA.GET_BANK_TRANSFER_ROWS(t, detail)} />
                </section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
