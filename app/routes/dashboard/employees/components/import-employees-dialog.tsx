import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { UploadFile } from '~/components/uploads/upload-file'
import { commonHelper } from '~/helpers/common.helper'
import { useInvalidateEmployees } from '~/hooks/apis/use-employee-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { EmployeeService } from '~/services/employee.service'
import type { IEmployeeImportResult } from '~/shared/models/employee.model'

interface IProps {
  open: boolean
  companyId?: string
  onClose: () => void
}

/** Spec: max upload of the media/file endpoints (EMP_026 reports the server limit) */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

// Spec: POST /employees/import — .xlsx, first sheet, ≤ 200 rows; each row is created like Add Employee
// (account + emailed password); refused rows come back in errors[] and the other rows are kept.
export function ImportEmployeesDialog({ open, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateEmployees()
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<IEmployeeImportResult | undefined>()

  const { mutate: importFile, isPending } = useMutationApi({
    mutationFn: (file: File) => EmployeeService.Import(companyId, file),
    onSuccess: async (res) => {
      setResult(res?.data)
      await invalidate()
    }
  })

  const downloadTemplate = async () => {
    try {
      commonHelper.downloadBlob(await EmployeeService.GetImportTemplate(), 'employees-import-template.xlsx')
    } catch {
      // axiosClient already showed the error toast
    }
  }

  const handleClose = () => {
    if (isPending) return
    setFiles([])
    setResult(undefined)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('employee.import.title')}</DialogTitle>
          <DialogDescription>{t('employee.import.description')}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className='flex min-w-0 flex-col gap-3' role='status'>
            <p className='font-medium'>
              {t('employee.import.result', { created: result.created ?? 0, total: result.total ?? 0 })}
            </p>
            {!!result.errors?.length && (
              <ul
                className='max-h-60 overflow-y-auto rounded-md border text-sm'
                aria-label={t('employee.import.errors')}
              >
                {result.errors.map((error, index) => (
                  <li key={index} className='border-b px-3 py-2 last:border-b-0'>
                    <span className='font-medium'>{t('employee.import.row', { row: error.row ?? '-' })}</span>{' '}
                    {error.message || error.code}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            <Button
              type='button'
              variant='link'
              className='h-auto self-start p-0'
              onClick={() => void downloadTemplate()}
            >
              <Download />
              {t('employee.import.template')}
            </Button>
            <UploadFile
              value={files}
              onChange={setFiles}
              accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              maxFileSizeBytes={MAX_IMPORT_BYTES}
              maxFileSizeExceeded={t('upload.too_large', { size: '5 MB' })}
              title={t('employee.import.choose')}
              description={t('employee.import.hint')}
              disabled={isPending}
            />
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button className='h-[38px]' onClick={handleClose}>
              {t('common.close')}
            </Button>
          ) : (
            <>
              <Button variant='outline' className='h-[38px]' onClick={handleClose} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button
                className='h-[38px]'
                disabled={!files[0] || isPending}
                onClick={() => files[0] && importFile(files[0])}
              >
                {isPending ? t('employee.import.importing') : t('employee.import.submit')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
