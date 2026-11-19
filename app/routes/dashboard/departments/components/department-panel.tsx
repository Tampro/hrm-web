import { Boxes, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InfoRows } from '~/components/customs/info-rows'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { useGetDepartmentDetailApi } from '~/hooks/apis/use-org-api'
import { useTransferEnum } from '~/hooks/use-transfer-enum'
import { DATA } from '~/shared/constants/data.constant'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IDepartment } from '~/shared/models/org.model'

interface IProps {
  departmentId?: string
  canManage: boolean
  onEdit: (department: IDepartment) => void
  onDelete: (department: IDepartment) => void
}

// Design CmsPhongBan right column "Phòng ban đang chọn". Spec: GET /org/departments/{id} (designation and employee counts)
export function DepartmentPanel({ departmentId, canManage, onEdit, onDelete }: IProps) {
  const { t } = useTranslation()
  const { getTranslateEnum } = useTransferEnum()
  const { detail, isLoading } = useGetDepartmentDetailApi({ id: departmentId })

  return (
    <aside
      aria-label={t('department.panel.title')}
      className='bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-5 lg:sticky lg:top-4'
    >
      <h2 className='text-muted-foreground text-sm font-semibold uppercase'>{t('department.panel.title')}</h2>
      {!departmentId ? (
        <p className='text-muted-foreground text-sm'>{t('department.panel.empty')}</p>
      ) : isLoading ? (
        <div className='flex flex-col gap-2'>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className='h-5 w-full' />
          ))}
        </div>
      ) : (
        <>
          <div className='flex items-start gap-3'>
            <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
              <Boxes className='size-5' />
            </span>
            <div className='min-w-0 flex-1'>
              <p className='font-semibold break-words'>{detail?.name || '-'}</p>
              {detail?.description && <p className='text-muted-foreground text-sm break-words'>{detail.description}</p>}
            </div>
            {detail?.status && (
              <Badge
                variant='outline'
                className={detail.status === EOrgStatus.Active ? 'bg-emerald-50 text-emerald-700' : undefined}
              >
                {getTranslateEnum(detail.status)}
              </Badge>
            )}
          </div>
          <InfoRows rows={DATA.GET_DEPARTMENT_DETAIL_ROWS(t, detail)} />
          {canManage && detail && (
            <div className='flex gap-2'>
              <Button className='h-[38px] flex-1' onClick={() => onEdit(detail)}>
                <Pencil />
                {t('department.action.edit')}
              </Button>
              <Button variant='outline' className='text-destructive h-[38px]' onClick={() => onDelete(detail)}>
                <Trash2 />
                {t('department.action.delete')}
              </Button>
            </div>
          )}
          {/* Spec: EMP_010 — refused while a designation or an employee uses it */}
          <p className='bg-muted/50 text-muted-foreground rounded-md p-3 text-sm'>
            {t('department.panel.delete_note')}
          </p>
        </>
      )}
    </aside>
  )
}
