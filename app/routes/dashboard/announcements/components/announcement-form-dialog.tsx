import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormDateField } from '~/components/forms/form-date-field'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormSelectField } from '~/components/forms/form-select-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSet } from '~/components/ui/field'
import { UploadFile } from '~/components/uploads/upload-file'
import { getAnnouncementCategoryName } from '~/helpers/columns/announcement-mgt-column'
import { commonHelper } from '~/helpers/common.helper'
import {
  getAnnouncementSchema,
  MAX_ANNOUNCEMENT_ATTACHMENTS,
  type TAnnouncementAttachmentItem,
  type TAnnouncementSchema
} from '~/helpers/schemas/announcement.schema'
import { useAnnouncementCategoriesApi, useInvalidateAnnouncements } from '~/hooks/apis/use-announcement-api'
import { useBranchOptionsApi } from '~/hooks/apis/use-employee-api'
import { useDepartmentChoicesApi } from '~/hooks/apis/use-org-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { AnnouncementService } from '~/services/announcement.service'
import { MediaService } from '~/services/employee.service'
import { EAnnouncementFormKey } from '~/shared/enums/form.enum'
import type { IAnnouncement, IAnnouncementPayload } from '~/shared/models/announcement.model'

import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES } from '../../employees/employee-upsert/components/step-account'

const DEFAULT_VALUES: TAnnouncementSchema = {
  [EAnnouncementFormKey.Title]: '',
  [EAnnouncementFormKey.CategoryId]: '',
  [EAnnouncementFormKey.ShortDescription]: '',
  [EAnnouncementFormKey.Content]: '',
  [EAnnouncementFormKey.StartDate]: '',
  [EAnnouncementFormKey.EndDate]: '',
  [EAnnouncementFormKey.Files]: [],
  [EAnnouncementFormKey.Featured]: false,
  [EAnnouncementFormKey.HighPriority]: false,
  [EAnnouncementFormKey.CompanyWide]: true,
  [EAnnouncementFormKey.BranchIds]: [],
  [EAnnouncementFormKey.DepartmentIds]: []
}

const toFormValues = (a: IAnnouncement): TAnnouncementSchema => ({
  title: a.title ?? '',
  categoryId: a.category?.id ?? '',
  shortDescription: a.shortDescription ?? '',
  content: a.content ?? '',
  startDate: a.startDate ?? '',
  endDate: a.endDate ?? '',
  files: (a.attachments ?? []).map((f) => ({ fileId: f.fileId, name: f.name ?? '-' })),
  featured: !!a.featured,
  highPriority: !!a.highPriority,
  companyWide: !!a.companyWide,
  branchIds: (a.branches ?? []).map((b) => b.id ?? '').filter(Boolean),
  departmentIds: (a.departments ?? []).map((d) => d.id ?? '').filter(Boolean)
})

interface IProps {
  /** `null` = create, an announcement (detail, with content) = edit, `undefined` = closed */
  announcement: IAnnouncement | null | undefined
  companyId?: string
  onClose: () => void
  onSaved?: (saved?: IAnnouncement) => void
}

// Manual 6.3.5 Add Announcement. Spec: POST /org/announcements, PUT /{id} (full replacement: omitted lists cleared,
// omitted flags false); content is HTML, sanitised by the backend; attachments are media library file ids (≤ 10)
export function AnnouncementFormDialog({ announcement: prop, companyId, onClose, onSaved }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateAnnouncements()
  const announcement = useLastDefined(prop)
  const isOpen = prop !== undefined
  const isEdit = !!announcement
  const [isPreview, setIsPreview] = useState(false)
  const { data: categories = [] } = useAnnouncementCategoriesApi(companyId, isOpen)
  const { data: branches = [] } = useBranchOptionsApi(companyId, isOpen)
  const departments = useDepartmentChoicesApi(companyId, isOpen)

  const form = useForm<TAnnouncementSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getAnnouncementSchema(t)),
    mode: 'all'
  })
  const [companyWide, content] = useWatch({
    control: form.control,
    name: [EAnnouncementFormKey.CompanyWide, EAnnouncementFormKey.Content]
  })

  useEffect(() => {
    if (prop === undefined) return
    form.reset(prop ? toFormValues(prop) : DEFAULT_VALUES)
  }, [prop, form])

  // targets of the announcement that are no longer active stay listed (and checked)
  const branchItems = [
    ...branches.map((b) => ({ id: b.id ?? '', name: b.name ?? '-' })),
    ...(announcement?.branches ?? [])
      .filter((b) => b.id && !branches.some((x) => x.id === b.id))
      .map((b) => ({ id: b.id ?? '', name: b.name ?? '-' }))
  ]
  const departmentItems = [
    ...departments.map((d) => ({ id: d.value, name: d.label })),
    ...(announcement?.departments ?? [])
      .filter((d) => d.id && !departments.some((x) => x.value === d.id))
      .map((d) => ({ id: d.id ?? '', name: d.name ?? '-' }))
  ]

  const { mutate, isPending } = useMutationApi({
    mutationFn: async (v: TAnnouncementSchema) => {
      // new files go to the media library first; order of the list is kept
      const attachmentIds: number[] = []
      for (const item of v.files) {
        if (item.fileId) attachmentIds.push(Number(item.fileId))
        else if (item.file) {
          const res = await MediaService.Upload(companyId, item.file)
          attachmentIds.push(Number(res?.data?.[0]?.id))
        }
      }
      const payload: IAnnouncementPayload = {
        title: v.title.trim(),
        categoryId: Number(v.categoryId),
        shortDescription: v.shortDescription || undefined,
        content: v.content,
        startDate: v.startDate,
        endDate: v.endDate,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
        featured: v.featured,
        highPriority: v.highPriority,
        companyWide: v.companyWide,
        // Spec: companyWide ignores the targets — not sent then
        branchIds: !v.companyWide && v.branchIds.length ? v.branchIds.map(Number) : undefined,
        departmentIds: !v.companyWide && v.departmentIds.length ? v.departmentIds.map(Number) : undefined
      }
      return announcement?.id
        ? await AnnouncementService.Update(announcement.id, payload)
        : await AnnouncementService.Create(companyId, payload)
    },
    onSuccess: async (res) => {
      toast.success(t(isEdit ? 'announcement.toast.updated' : 'announcement.toast.created'))
      await invalidate()
      onSaved?.(res?.data)
      close()
    }
  })

  // the next opening starts on the HTML editor again
  const close = () => {
    setIsPreview(false)
    onClose()
  }

  const checkboxes = (
    name: EAnnouncementFormKey.BranchIds | EAnnouncementFormKey.DepartmentIds,
    legend: string,
    items: { id: string; name: string }[]
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <FieldSet>
          <FieldLegend variant='label'>{legend}</FieldLegend>
          {items.length === 0 ? (
            <p className='text-muted-foreground text-sm'>{t('announcement.form.no_options')}</p>
          ) : (
            <div className='grid max-h-36 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-2'>
              {items.map((item) => (
                <label key={item.id} className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    className='accent-primary size-4'
                    checked={field.value.includes(item.id)}
                    onChange={(e) => {
                      field.onChange(
                        e.target.checked ? [...field.value, item.id] : field.value.filter((id) => id !== item.id)
                      )
                      void form.trigger(EAnnouncementFormKey.CompanyWide)
                    }}
                  />
                  {item.name}
                </label>
              ))}
            </div>
          )}
        </FieldSet>
      )}
    />
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && close()}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'announcement.form.edit_title' : 'announcement.form.create_title')}</DialogTitle>
          <DialogDescription>{t('announcement.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id='announcement-form'
          className='-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1'
          onSubmit={form.handleSubmit((v) => mutate(v))}
          noValidate
        >
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={EAnnouncementFormKey.Title}
                label={t('announcement.field.title')}
                required
              />
              <FormSelectField
                control={form.control}
                name={EAnnouncementFormKey.CategoryId}
                label={t('announcement.field.category')}
                options={categories.map((c) => ({ label: getAnnouncementCategoryName(t, c), value: c.id ?? '' }))}
              />
            </div>
            <FormInputField
              control={form.control}
              name={EAnnouncementFormKey.ShortDescription}
              label={t('announcement.field.short_description')}
            />

            {/* plain HTML (decision for this release): edit and preview, the backend strips scripts / handlers */}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium'>
                  {t('announcement.field.content')}{' '}
                  <span aria-hidden className='text-destructive'>
                    *
                  </span>
                </span>
                <div
                  role='group'
                  aria-label={t('announcement.form.content_mode')}
                  className='bg-muted flex rounded-md p-0.5'
                >
                  {[false, true].map((preview) => (
                    <Button
                      key={String(preview)}
                      type='button'
                      size='sm'
                      variant={isPreview === preview ? 'default' : 'ghost'}
                      aria-pressed={isPreview === preview}
                      onClick={() => setIsPreview(preview)}
                    >
                      {t(preview ? 'announcement.form.preview' : 'announcement.form.edit_html')}
                    </Button>
                  ))}
                </div>
              </div>
              {isPreview ? (
                <iframe
                  title={t('announcement.form.preview')}
                  sandbox=''
                  srcDoc={content}
                  className='h-60 w-full rounded-md border bg-white'
                />
              ) : (
                <FormTextareaField
                  control={form.control}
                  name={EAnnouncementFormKey.Content}
                  label={<span className='sr-only'>{t('announcement.field.content')}</span>}
                  description={t('announcement.form.content_hint')}
                  rows={8}
                />
              )}
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormDateField
                control={form.control}
                name={EAnnouncementFormKey.StartDate}
                label={t('announcement.field.start_date')}
                required
              />
              <FormDateField
                control={form.control}
                name={EAnnouncementFormKey.EndDate}
                label={t('announcement.field.end_date')}
                required
              />
            </div>

            <Controller
              name={EAnnouncementFormKey.Files}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLegend variant='label'>{t('announcement.field.attachments')}</FieldLegend>
                  {field.value.filter((f) => f.fileId).length > 0 && (
                    <ul className='flex flex-col gap-1'>
                      {field.value
                        .filter((f) => f.fileId)
                        .map((f) => (
                          <li
                            key={f.fileId}
                            className='bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm'
                          >
                            <span className='flex min-w-0 items-center gap-2'>
                              <Paperclip className='size-4 shrink-0' />
                              <span className='truncate'>{f.name}</span>
                            </span>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon-sm'
                              aria-label={t('upload.remove', { name: f.name })}
                              onClick={() => field.onChange(field.value.filter((x) => x !== f))}
                            >
                              <X />
                            </Button>
                          </li>
                        ))}
                    </ul>
                  )}
                  <UploadFile
                    value={field.value.filter((f) => f.file).map((f) => f.file as File)}
                    onChange={(files) =>
                      field.onChange([
                        ...field.value.filter((f) => f.fileId),
                        ...files.map((file): TAnnouncementAttachmentItem => ({ name: file.name, file }))
                      ])
                    }
                    isMultiple
                    accept={DOCUMENT_ACCEPT}
                    maxFileSizeBytes={MAX_DOCUMENT_BYTES}
                    maxFileSizeExceeded={t('upload.too_large', { size: '5 MB' })}
                    title={t('announcement.form.choose_files')}
                    description={t('announcement.form.files_hint', {
                      max: MAX_ANNOUNCEMENT_ATTACHMENTS,
                      size: commonHelper.formatFileSize(MAX_DOCUMENT_BYTES)
                    })}
                    isInValid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className='grid gap-3 sm:grid-cols-2'>
              <FormSwitchField
                control={form.control}
                name={EAnnouncementFormKey.Featured}
                label={t('announcement.field.featured')}
              />
              <FormSwitchField
                control={form.control}
                name={EAnnouncementFormKey.HighPriority}
                label={t('announcement.field.high_priority')}
              />
            </div>

            <FieldSet>
              <FormSwitchField
                control={form.control}
                name={EAnnouncementFormKey.CompanyWide}
                label={t('announcement.field.company_wide')}
                description={t('announcement.form.company_wide_hint')}
              />
              {form.formState.errors.companyWide && <FieldError errors={[form.formState.errors.companyWide]} />}
              {!companyWide && (
                <div className='grid gap-4 sm:grid-cols-2'>
                  {checkboxes(EAnnouncementFormKey.BranchIds, t('announcement.field.branches'), branchItems)}
                  {checkboxes(EAnnouncementFormKey.DepartmentIds, t('announcement.field.departments'), departmentItems)}
                </div>
              )}
              {!companyWide && <FieldDescription>{t('announcement.form.targets_hint')}</FieldDescription>}
            </FieldSet>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={close} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='announcement-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'announcement.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
