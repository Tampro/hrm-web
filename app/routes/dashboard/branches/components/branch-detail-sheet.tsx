import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetBranchDetailApi } from '~/hooks/apis/use-org-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { DATA } from '~/shared/constants/data.constant'

interface IProps {
  branchId: string | undefined
  onClose: () => void
}

/** Manual 6.2 View. Spec: GET /org/branches/{id} — details with department and employee counts (EMP_002 when missing) */
export function BranchDetailSheet({ branchId: idProp, onClose }: IProps) {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const branchId = useLastDefined(idProp)
  const { detail, isLoading } = useGetBranchDetailApi({ id: branchId })

  return (
    <Sheet open={!!idProp} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{t('branch.detail.title')}</SheetTitle>
          <SheetDescription>{detail?.name || '-'}</SheetDescription>
        </SheetHeader>
        <div className='px-4 pb-6'>
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className='h-5 w-full' />
              ))}
            </div>
          ) : (
            <InfoRows rows={DATA.GET_BRANCH_DETAIL_ROWS(t, detail, getTranslateEnum)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
