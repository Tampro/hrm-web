import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { FormInputField } from '~/components/forms/form-input-field'
import { FormSwitchField } from '~/components/forms/form-switch-field'
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
import { getBranchSchema, type TBranchSchema } from '~/helpers/schemas/org.schema'
import { useInvalidateBranches } from '~/hooks/apis/use-org-api'
import { useLastDefined } from '~/hooks/use-last-defined'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { BranchService } from '~/services/org.service'
import { EBranchFormKey } from '~/shared/enums/form.enum'
import { EOrgStatus } from '~/shared/enums/org.enum'
import type { IBranch, IBranchPayload } from '~/shared/models/org.model'

const DEFAULT_VALUES: TBranchSchema = {
  [EBranchFormKey.Name]: '',
  [EBranchFormKey.Address]: '',
  [EBranchFormKey.City]: '',
  [EBranchFormKey.State]: '',
  [EBranchFormKey.Country]: '',
  [EBranchFormKey.PostalCode]: '',
  [EBranchFormKey.Phone]: '',
  [EBranchFormKey.Email]: '',
  [EBranchFormKey.Active]: true
}

const toFormValues = (b: IBranch): TBranchSchema => ({
  name: b.name ?? '',
  address: b.address ?? '',
  city: b.city ?? '',
  state: b.state ?? '',
  country: b.country ?? '',
  postalCode: b.postalCode ?? '',
  phone: b.phone ?? '',
  email: b.email ?? '',
  active: b.status !== EOrgStatus.Inactive
})

// Spec: BranchForm — PUT is a full replacement: an empty optional field is omitted and therefore cleared
const toPayload = (v: TBranchSchema): IBranchPayload => ({
  name: v.name.trim(),
  address: v.address || undefined,
  city: v.city || undefined,
  state: v.state || undefined,
  country: v.country || undefined,
  postalCode: v.postalCode || undefined,
  phone: v.phone || undefined,
  email: v.email || undefined,
  status: v.active ? EOrgStatus.Active : EOrgStatus.Inactive
})

interface IProps {
  /** `null` = create, a branch = edit, `undefined` = closed */
  branch: IBranch | null | undefined
  /** super admin: company the new branch belongs to */
  companyId?: string
  onClose: () => void
}

/** Manual 6.2 Add / Edit branch. Spec: POST /org/branches, PUT /org/branches/{id}; EMP_011 = name already used */
export function BranchFormDialog({ branch: branchProp, companyId, onClose }: IProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateBranches()
  const branch = useLastDefined(branchProp)
  const isOpen = branchProp !== undefined
  const isEdit = !!branch

  const form = useForm<TBranchSchema>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(getBranchSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (branchProp !== undefined) form.reset(branchProp ? toFormValues(branchProp) : DEFAULT_VALUES)
  }, [branchProp, form])

  const { mutate, isPending } = useMutationApi({
    mutationFn: (values: TBranchSchema) =>
      branch?.id
        ? BranchService.Update(branch.id, toPayload(values))
        : BranchService.Create(companyId, toPayload(values)),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'branch.toast.updated' : 'branch.toast.created'))
      await invalidate()
      onClose()
    }
  })

  const field = (name: EBranchFormKey, label: string, extra: object = {}) => (
    <FormInputField control={form.control} name={name} label={label} {...extra} />
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'branch.form.edit_title' : 'branch.form.create_title')}</DialogTitle>
          <DialogDescription>{t('branch.form.description')}</DialogDescription>
        </DialogHeader>
        <form id='branch-form' className='min-w-0' onSubmit={form.handleSubmit((v) => mutate(v))} noValidate>
          <FieldGroup>
            {field(EBranchFormKey.Name, t('branch.field.name'), {
              required: true,
              placeholder: t('branch.form.name_placeholder')
            })}
            {field(EBranchFormKey.Address, t('branch.field.address'))}
            <div className='grid gap-4 sm:grid-cols-2'>
              {field(EBranchFormKey.City, t('branch.field.city'))}
              {field(EBranchFormKey.State, t('branch.field.state'))}
              {field(EBranchFormKey.Country, t('branch.field.country'))}
              {field(EBranchFormKey.PostalCode, t('branch.field.postal_code'))}
              {field(EBranchFormKey.Phone, t('branch.field.phone'), { inputMode: 'tel' })}
              {field(EBranchFormKey.Email, t('branch.field.email'), { type: 'email' })}
            </div>
            <FormSwitchField
              control={form.control}
              name={EBranchFormKey.Active}
              label={t('branch.field.active')}
              description={t('branch.form.active_hint')}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' form='branch-form' className='h-[38px]' disabled={isPending}>
            {isPending ? t('common.saving') : t(isEdit ? 'common.save' : 'branch.form.create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
