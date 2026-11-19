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
import { getDepartmentSchema, type TDepartmentSchema } from '~/helpers/schemas/org.schema'
import { useBranchOptionsApi } from '~/hooks/apis/use-employee-api'
import { useInvalidateDepartments } from '~/hooks/apis/use-org-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { DepartmentService } from '~/services/org.service'
import { EDepartmentFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IDepartment, IDepartmentPayload } from '~/shared/models/org.model'

const DEFAULT_VALUES: TDepartmentSchema = {
  [EDepartmentFormKey.Name]: '',
  [EDepartmentFormKey.BranchId]: '',
  [EDepartmentFormKey.Description]: '',
  [EDepartmentFormKey.Active]: true
}

const toFormValues = (d: IDepartment): TDepartmentSchema => ({
  name: d.name ?? '',
  branchId: d.branch?.id ?? '',
  description: d.description ?? '',
  active: d.status !== EOrgStatus.Inactive
})

// Spec: DepartmentForm — PUT is a full replacement: an empty description is omitted and therefore cleared
const toPayload = (v: TDepartmentSchema): IDepartmentPayload => ({
  name: v.name.trim(),
  branchId: Number(v.branchId),
  description: v.description || undefined,
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** `null` = create, a department = edit, `undefined` = closed */
  department: IDepartment | null | undefined
  /** super admin: company the department belongs to */
  companyId?: string
  onClose: () => void
}

// Design CmsPhongBanThem. Spec: POST /org/departments, PUT /org/departments/{id};
// EMP_011 name taken in the branch, EMP_029 inactive branch, EMP_010 branch change refused while in use
export function DepartmentFormDialog({ department: departmentProp, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateDepartments()
  const department = useLastDefined(departmentProp)
  const isOpen = departmentProp !== undefined
  const isEdit = !!department
  const { data: branches = [] } = useBranchOptionsApi(companyId, isOpen)

  // active branches only (Spec: options); the saved branch stays listed even when it is inactive now
  const branchOptions = branches.map((b) => ({ label: b.name ?? '-', value: b.id ?? '' }))
  const current = department?.branch
  if (current?.id && !branchOptions.some((o) => o.value === current.id)) {
    branchOptions.push({ label: current.name ?? current.id, value: current.id })
  }

  const form = useForm<TDepartmentSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getDepartmentSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (departmentProp !== undefined) form.reset(departmentProp ? toFormValues(departmentProp) : DEFAULT_VALUES)
  }, [departmentProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TDepartmentSchema) =>
      department?.id
        ? DepartmentService.Update(department.id, toPayload(values))
        : DepartmentService.Create(companyId, toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'department.toast.updated' : 'department.toast.created'))
      await invalidate()
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'department.form.edit_title' : 'department.form.create_title')}</DialogTitle>
          <DialogDescription>{t('department.form.description')}</DialogDescription>
        </DialogHeader>
        <form id='department-form' className='min-w-0' onSubmit={form.handleSubmit((v) => mutate(v))} noValidate>
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormInputField
                control={form.control}
                name={EDepartmentFormKey.Name}
                label={t('department.field.name')}
                placeholder={t('department.form.name_placeholder')}
                required
              />
              <FormSelectField
                control={form.control}
                name={EDepartmentFormKey.BranchId}
                label={t('department.field.branch')}
                options={branchOptions}
                description={branchOptions.length ? undefined : t('department.form.no_branch')}
              />
            </div>
            <FormTextareaField
              control={form.control}
              name={EDepartmentFormKey.Description}
              label={t('department.field.description')}
            />
            <FormSwitchField
              control={form.control}
              name={EDepartmentFormKey.Active}
              label={t('department.field.active')}
              description={t('department.form.active_hint')}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='department-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'department.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
