import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
import { useInvalidateAttendance } from '~/hooks/apis/use-attendance-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import type { IApiResponse } from '~/shared/models/common.model'
import type { IAttendanceImportResult } from '~/shared/models/attendance.model'

// Spec: import — .xlsx, at most 5 MB and 2000 rows; rows with errors are skipped and reported
const MAX_BYTES = 5 * 1024 * 1024
const XLSX = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface IProps {
  open: boolean
  companyId?: string
  title: string
  description: string
  /** file name of the downloaded template */
  templateName: string
  getTemplate: () => Promise<Blob>
  importFile: (companyId: string | undefined, file: File) => Promise<IApiResponse<IAttendanceImportResult>>
  onClose: () => void
}

// Manual 6.4.1 / 6.4.2 Import: template download, one .xlsx upload, the result with per-row errors
export function ImportDialog({
  open,
  companyId,
  title,
  description,
  templateName,
  getTemplate,
  importFile,
  onClose
}: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAttendance()
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<IAttendanceImportResult | undefined>()

  const close = () => {
    setFiles([])
    setResult(undefined)
    onClose()
  }

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutationApi({
    mutationFn: getTemplate,
    onSuccess: (blob) => commonHelper.downloadBlob(blob, templateName)
  })

  const { mutate: upload, isPending } = useMutationApi({
    mutationFn: (file: File) => importFile(companyId, file),
    onSuccess: async (res) => {
      setResult(res?.data)
      setFiles([])
      toast.success(t('attendance_record.import.done'))
      await invalidate()
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isPending && close()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Button
          variant='outline'
          className='h-[38px] self-start'
          onClick={() => downloadTemplate()}
          disabled={isDownloading}
        >
          <Download />
          {t('attendance_record.import.template')}
        </Button>
        <UploadFile
          value={files}
          onChange={setFiles}
          accept={XLSX}
          maxFileSizeBytes={MAX_BYTES}
          maxFileSizeExceeded={t('attendance_record.import.too_large')}
          title={t('attendance_record.import.drop')}
          description={t('attendance_record.import.limits')}
          ariaLabel={t('attendance_record.import.file')}
          disabled={isPending}
        />
        {result && (
          <section
            aria-label={t('attendance_record.import.result')}
            className='bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 text-sm'
          >
            <p>
              {t(
                result.updated === undefined
                  ? 'attendance_record.import.summary_created'
                  : 'attendance_record.import.summary',
                {
                  total: result.total ?? 0,
                  created: result.created ?? 0,
                  updated: result.updated ?? 0,
                  failed: result.errors?.length ?? 0
                }
              )}
            </p>
            {!!result.errors?.length && (
              <ul className='text-destructive max-h-40 list-disc overflow-y-auto pl-5'>
                {result.errors.map((e, i) => (
                  <li key={`${e.row}-${i}`}>
                    {t('attendance_record.import.row_error', { row: e.row, message: e.message })}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={close} disabled={isPending}>
            {t('common.close')}
          </Button>
          <Button className='h-[38px]' onClick={() => files[0] && upload(files[0])} disabled={!files[0] || isPending}>
            {isPending ? t('attendance_record.import.uploading') : t('attendance_record.import.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
