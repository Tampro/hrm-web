import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Textarea } from '~/components/ui/textarea'
import type { TDecision } from '~/helpers/columns/plan-mgt-column'
import { getDecisionSchema, type TDecisionSchema } from '~/helpers/schema.helper'
import { useLastDefined } from '~/hooks/use-last-defined'
import { EDecisionFormKey } from '~/shared/enums/form.enum'

export interface IDecisionTarget {
  decision: TDecision
  /** e.g. company name or order number, shown in the title */
  label: string
}

interface IProps {
  target: IDecisionTarget | undefined
  loading?: boolean
  onClose: () => void
  onSubmit: (notes: string) => void
}

/** Approve / reject a plan request or order. Spec: OrderDecisionForm { notes ≤ 500 } shown to the company */
export function DecisionDialog({ target: targetProp, loading, onClose, onSubmit }: IProps) {
  const { t } = useTranslation()
  const target = useLastDefined(targetProp)
  const isReject = target?.decision === 'reject'
  const form = useForm<TDecisionSchema>({
    defaultValues: { [EDecisionFormKey.Notes]: '' },
    resolver: zodResolver(getDecisionSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    if (targetProp) form.reset({ notes: '' })
  }, [targetProp, form])

  return (
    <Dialog open={!!targetProp} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t(isReject ? 'saas.decision.reject_title' : 'saas.decision.approve_title', { name: target?.label ?? '-' })}
          </DialogTitle>
          <DialogDescription>
            {t(isReject ? 'saas.decision.reject_description' : 'saas.decision.approve_description')}
          </DialogDescription>
        </DialogHeader>
        {/* min-w-0: a grid child would otherwise grow with long unbroken text and push the footer out of view */}
        <form
          id='decision-form'
          className='min-w-0'
          onSubmit={form.handleSubmit((values) => onSubmit(values.notes))}
          noValidate
        >
          <Controller
            name={EDecisionFormKey.Notes}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='decision-notes'>
                  {t(isReject ? 'saas.decision.reason' : 'saas.decision.notes')}
                </FieldLabel>
                <Textarea
                  {...field}
                  id='decision-notes'
                  rows={3}
                  aria-invalid={fieldState.invalid}
                  className='max-h-40 [overflow-wrap:anywhere]'
                />
                <FieldDescription>{t('saas.decision.notes_hint')}</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant='outline' className='h-[38px]' onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            form='decision-form'
            variant={isReject ? 'destructive' : 'default'}
            className='h-[38px]'
            disabled={loading}
          >
            {loading ? t('common.saving') : t(isReject ? 'saas.action.reject' : 'saas.action.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
