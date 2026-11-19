import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { TableCustom } from '~/components/customs/table-custom'
import { FormDateField } from '~/components/forms/form-date-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Field, FieldError } from '~/components/ui/field'
import { UploadFile } from '~/components/uploads/upload-file'
import { employeeMgtColumn, type TDocumentAction } from '~/helpers/columns/employee-mgt-column'
import { getEmployeeDocumentSchema, type TEmployeeDocumentSchema } from '~/helpers/schemas/employee.schema'
import { useDocumentTypesApi, useInvalidateEmployees } from '~/hooks/apis/use-employee-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { EmployeeService, MediaService } from '~/services/employee.service'
import { EEmployeeDocumentFormKey } from '~/shared/enums/form.enum'
import type { IEmployeeDetail, IEmployeeDocument } from '~/shared/models/employee.model'

import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES } from '../../employee-upsert/components/step-account'

interface IProps {
  employee: IEmployeeDetail
  canUpdate: boolean
}

const EMPTY: TEmployeeDocumentSchema = { documentTypeId: '', file: null, expiryDate: '' }

// Spec: documents come with the profile (GET /{id}); POST /{id}/documents (media file id, max 5 MB),
// PUT /{id}/documents/{documentId}/verify, DELETE (the file stays in the media library)
export function EmployeeDocuments({ employee, canUpdate }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateEmployees()
  const id = employee.id ?? ''
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [removing, setRemoving] = useState<IEmployeeDocument | undefined>()
  const { data: documentTypes = [] } = useDocumentTypesApi(employee.companyId, isAddOpen)
  const rows = useMemo(() => (employee.documents ?? []).map((d, i) => ({ ...d, id: d.id ?? String(i) })), [employee])

  const form = useForm<TEmployeeDocumentSchema>({
    defaultValues: EMPTY,
    resolver: zodResolver(getEmployeeDocumentSchema(t)),
    mode: 'all'
  })

  const addMutation = useMutationApi({
    mutationFn: async (values: TEmployeeDocumentSchema) => {
      const uploaded = await MediaService.Upload(employee.companyId, values.file as File)
      return await EmployeeService.AddDocument(id, {
        documentTypeId: Number(values.documentTypeId),
        fileId: Number(uploaded?.data?.[0]?.id),
        expiryDate: values.expiryDate || undefined
      })
    },
    onSuccess: async () => {
      toast.success(t('employee.toast.document_added'))
      await invalidate()
      form.reset(EMPTY)
      setIsAddOpen(false)
    }
  })
  const verifyMutation = useMutationApi({
    mutationFn: (doc: IEmployeeDocument) => EmployeeService.VerifyDocument(id, doc.id ?? '', !doc.verified),
    onSuccess: async (_, doc) => {
      toast.success(t(doc.verified ? 'employee.toast.document_unverified' : 'employee.toast.document_verified'))
      await invalidate()
    }
  })
  const removeMutation = useMutationApi({
    mutationFn: (doc: IEmployeeDocument) => EmployeeService.DeleteDocument(id, doc.id ?? ''),
    onSuccess: async () => {
      toast.success(t('employee.toast.document_removed'))
      await invalidate()
      setRemoving(undefined)
    }
  })

  const columns = useMemo(
    () =>
      employeeMgtColumn.getDocument(
        t,
        (action: TDocumentAction, doc) => (action === 'verify' ? verifyMutation.mutate(doc) : setRemoving(doc)),
        canUpdate
      ),
    [t, canUpdate, verifyMutation]
  )

  const closeAdd = () => {
    if (addMutation.isPending) return
    form.reset(EMPTY)
    setIsAddOpen(false)
  }

  return (
    <>
      <TableCustom
        columns={columns}
        data={rows}
        headerTitle={t('employee.detail_tab.documents')}
        headerAction={
          canUpdate && (
            <Button className='h-[38px]' onClick={() => setIsAddOpen(true)}>
              <Plus />
              {t('employee.document.add')}
            </Button>
          )
        }
        totalItems={rows.length}
        disableNavigationAll
        emptyText={t('employee.document.empty')}
      />

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeAdd()}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('employee.document.add')}</DialogTitle>
            <DialogDescription>{t('employee.document.add_description')}</DialogDescription>
          </DialogHeader>
          <form
            id='employee-document-form'
            className='flex flex-col gap-4'
            onSubmit={form.handleSubmit((values) => addMutation.mutate(values))}
            noValidate
          >
            <FormSelectField
              control={form.control}
              name={EEmployeeDocumentFormKey.DocumentTypeId}
              label={t('employee.document.type')}
              options={documentTypes.map((d) => ({ label: d.name ?? '-', value: d.id ?? '' }))}
            />
            <Controller
              name={EEmployeeDocumentFormKey.File}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <UploadFile
                    value={field.value ? [field.value] : []}
                    onChange={(files) => field.onChange(files[0] ?? null)}
                    accept={DOCUMENT_ACCEPT}
                    maxFileSizeBytes={MAX_DOCUMENT_BYTES}
                    maxFileSizeExceeded={t('upload.too_large', { size: '5 MB' })}
                    title={t('employee.document.choose_file')}
                    description={t('employee.document.file_hint')}
                    isInValid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <FormDateField
              control={form.control}
              name={EEmployeeDocumentFormKey.ExpiryDate}
              label={t('employee.document.expiry_date')}
            />
          </form>
          <DialogFooter>
            <Button variant='outline' className='h-[38px]' onClick={closeAdd} disabled={addMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type='submit' form='employee-document-form' className='h-[38px]' disabled={addMutation.isPending}>
              {addMutation.isPending ? t('common.saving') : t('employee.document.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        open={!!removing}
        onOpenChange={(open) => !open && !removeMutation.isPending && setRemoving(undefined)}
        title={t('employee.document.remove_title')}
        description={t('employee.document.remove_description', { name: removing?.fileName ?? '-' })}
        confirmText={t('common.delete')}
        isDestructive
        loading={removeMutation.isPending}
        onConfirm={() => removing && removeMutation.mutate(removing)}
      />
    </>
  )
}
