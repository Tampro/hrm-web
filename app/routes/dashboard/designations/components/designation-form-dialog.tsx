import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
import { FieldGroup } from '~/components/ui/field'
import { getDesignationSchema, type TDesignationSchema } from '~/helpers/schemas/org.schema'
import { useDepartmentChoicesApi, useInvalidateDesignations } from '~/hooks/apis/use-org-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { DesignationService } from '~/services/org.service'
import { EDesignationFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IDesignation, IDesignationPayload } from '~/shared/models/org.model'

const DEFAULT_VALUES: TDesignationSchema = {
  [EDesignationFormKey.Name]: '',
  [EDesignationFormKey.DepartmentId]: '',
  [EDesignationFormKey.Description]: '',
  [EDesignationFormKey.Active]: true
}

const toFormValues = (d: IDesignation): TDesignationSchema => ({
  name: d.name ?? '',
  departmentId: d.department?.id ?? '',
  description: d.description ?? '',
  active: d.status !== EOrgStatus.Inactive
})

// Spec: DesignationForm — PUT is a full replacement: an empty description is omitted and therefore cleared
const toPayload = (v: TDesignationSchema): IDesignationPayload => ({
  name: v.name.trim(),
  departmentId: Number(v.departmentId),
  description: v.description || undefined,
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** `null` = create, a designation = edit, `undefined` = closed */
  designation: IDesignation | null | undefined
  /** super admin: company the designation belongs to */
  companyId?: string
  onClose: () => void
}

// Manual 6.4 Add / Edit designation. Spec: POST /org/designations, PUT /org/designations/{id};
// EMP_011 name taken in the department, EMP_030 inactive department, EMP_010 department change refused while in use
export function DesignationFormDialog({ designation: designationProp, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateDesignations()
  const designation = useLastDefined(designationProp)
  const isOpen = designationProp !== undefined
  const isEdit = !!designation
  const choices = useDepartmentChoicesApi(companyId, isOpen)

  // active departments only (Spec: options); the saved one stays listed even when it is inactive now
  const current = designation?.department
  const departmentOptions =
    current?.id && !choices.some((o) => o.value === current.id)
      ? [
          ...choices,
          {
            label: [current.name ?? current.id, designation?.branch?.name].filter(Boolean).join(' · '),
            value: current.id
          }
        ]
      : choices

  const form = useForm<TDesignationSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getDesignationSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (designationProp !== undefined) form.reset(designationProp ? toFormValues(designationProp) : DEFAULT_VALUES)
  }, [designationProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TDesignationSchema) =>
      designation?.id
        ? DesignationService.Update(designation.id, toPayload(values))
        : DesignationService.Create(companyId, toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'designation.toast.updated' : 'designation.toast.created'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'designation.form.edit_title' : 'designation.form.create_title')}</DialogTitle>
          <DialogDescription>{t('designation.form.description')}</DialogDescription>
        </DialogHeader>
        <form id='designation-form' className='min-w-0' onSubmit={form.handleSubmit((v) => mutate(v))} noValidate>
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={EDesignationFormKey.Name}
                label={t('designation.field.name')}
                placeholder={t('designation.form.name_placeholder')}
                required
              />
              <FormSelectField
                control={form.control}
                name={EDesignationFormKey.DepartmentId}
                label={t('designation.field.department')}
                options={departmentOptions}
                description={departmentOptions.length ? undefined : t('designation.form.no_department')}
              />
            </div>
            <FormTextareaField
              control={form.control}
              name={EDesignationFormKey.Description}
              label={t('designation.field.description')}
            />
            <FormSwitchField
              control={form.control}
              name={EDesignationFormKey.Active}
              label={t('designation.field.active')}
              description={t('designation.form.active_hint')}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='designation-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'designation.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
