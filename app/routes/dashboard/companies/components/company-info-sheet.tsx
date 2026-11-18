import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Badge } from '~/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetCompanyInfoApi } from '~/hooks/apis/use-company-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { DATA } from '~/shared/constants/data.constant'
import type { ICompany } from '~/shared/models/company.model'

interface IProps {
  company: ICompany | undefined
  onClose: () => void
}

/** Spec: GET /iam/companies/{id}/info — profile, subscription, account count vs plan limit, administrators */
export function CompanyInfoSheet({ company: companyProp, onClose }: IProps) {
  const company = useLastDefined(companyProp)
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { detail: info, isLoading } = useGetCompanyInfoApi({ id: company?.id })
  const admins = info?.administrators ?? []

  return (
    <Sheet open={!!companyProp} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{t('company.info.title')}</SheetTitle>
          <SheetDescription>{company?.name || '-'}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-6 overflow-y-auto px-4 pb-6'>
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className='h-5 w-full' />
              ))}
            </div>
          ) : (
            <InfoRows rows={DATA.GET_COMPANY_INFO_ROWS(t, info, getTranslateEnum)} />
          )}
          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>{t('company.info.administrators')}</h3>
            {!isLoading && admins.length === 0 && (
              <p className='text-muted-foreground text-sm'>{t('company.info.no_administrators')}</p>
            )}
            <ul className='flex flex-col gap-2'>
              {admins.map((admin) => (
                <li
                  key={admin.id ?? admin.username}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{admin.fullName || '-'}</span>
                    <span className='text-muted-foreground text-xs'>
                      {admin.username || '-'} · {admin.email || '-'}
                    </span>
                  </div>
                  <Badge variant={admin.status === 'LOCKED' ? 'destructive' : 'secondary'}>
                    {getTranslateEnum(admin.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
