import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'
import { EMPLOYEE_DEFAULT_VALUES, EMPLOYEE_STEP_FIELDS, employeeHelper } from '~/helpers/employee.helper'
import { getEmployeeSchema, type TEmployeeSchema } from '~/helpers/schemas/employee.schema'
import { useMeApi } from '~/hooks/apis/use-auth-api'
import {
  useDocumentTypesApi,
  useEmployeeCompany,
  useGetEmployeeDetailApi,
  useInvalidateEmployees
} from '~/hooks/apis/use-employee-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { PageLayout } from '~/layouts/page.layout'
import { EmployeeService, MediaService } from '~/services/employee.service'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EEmployeeStep } from '~/shared/enums/employee.enum'

import { CompanyPicker, PickCompanyHint } from '../components/company-picker'
import { EmployeeStepper } from './components/employee-stepper'
import { StepAccount } from './components/step-account'
import { StepBanking } from './components/step-banking'
import { StepPersonal } from './components/step-personal'
import { StepWork } from './components/step-work'

export function meta() {
  return [{ title: 'Employee · SPECOM HRM' }]
}

/** Spec: media upload returns the stored files; the employee endpoints take their int64 id */
const uploadOne = async (companyId: string | undefined, file: File) => {
  const res = await MediaService.Upload(companyId, file)
  return Number(res?.data?.[0]?.id)
}

// Manual 6.1 Add / Edit employee, design CmsThemNhanVien 1–4 (4 steps; Edit has 3: the login is managed on the profile).
// Spec: POST /employees (EmployeeCreateForm) · PUT /employees/{id} (ProfileForm, full replacement)
export default function EmployeeUpsertPage() {
  // Lib
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const invalidate = useInvalidateEmployees()
  const { data: me } = useMeApi()
  const canEditBanking = !!me?.superAdmin || !!me?.permissions?.includes('EMPLOYEE_BANKING_VIEW')

  // API
  const { detail, isLoading: isLoadingDetail, isError } = useGetEmployeeDetailApi({ id, enabled: !isCreate })
  const company = useEmployeeCompany()
  // edit: the employee's own company (super admin); create: the picked one
  const companyId = isCreate ? company.companyId : company.isSuperAdmin ? detail?.companyId : undefined
  const isReady = isCreate ? company.isReady : !!detail
  const { data: documentTypes = [] } = useDocumentTypesApi(companyId, isCreate && isReady)

  // Steps
  const steps = DATA.GET_EMPLOYEE_STEPS(t, isCreate)
  const [step, setStep] = useState<EEmployeeStep>(EEmployeeStep.Personal)
  const stepIndex = steps.findIndex((s) => s.value === step)
  const isLastStep = stepIndex === steps.length - 1
  const [isImageRemoved, setIsImageRemoved] = useState(false)

  // Form
  const form = useForm<TEmployeeSchema>({
    defaultValues: EMPLOYEE_DEFAULT_VALUES,
    resolver: zodResolver(getEmployeeSchema(t, isCreate)),
    mode: 'all'
  })

  useEffect(() => {
    if (detail) form.reset(employeeHelper.toFormValues(detail))
  }, [detail, form])

  // Submit
  const { mutate: save, isPending } = useMutationApi({
    mutationFn: async (values: TEmployeeSchema) => {
      let profileImageId: number | undefined
      if (values.profileImage) profileImageId = await uploadOne(companyId, values.profileImage)
      else if (!isCreate && !isImageRemoved && detail?.profileImageId) profileImageId = Number(detail.profileImageId)
      const profile = employeeHelper.toProfilePayload(values, profileImageId, detail)

      if (!isCreate) return await EmployeeService.Update(id, profile)
      const documents = []
      for (const doc of values.documents) {
        documents.push({
          documentTypeId: Number(doc.documentTypeId),
          fileId: await uploadOne(companyId, doc.file as File),
          expiryDate: doc.expiryDate || undefined
        })
      }
      return await EmployeeService.Create(companyId, {
        email: values.email.trim(),
        password: values.password || undefined,
        profile,
        documents: documents.length ? documents : undefined
      })
    },
    onSuccess: async (res) => {
      toast.success(t(isCreate ? 'employee.toast.created' : 'employee.toast.updated'))
      await invalidate()
      navigate(ROUTES.EMPLOYEE_DETAIL(res?.data?.id ?? id ?? ''))
    }
  })

  const goNext = async () => {
    if (await form.trigger(EMPLOYEE_STEP_FIELDS[step])) setStep(steps[stepIndex + 1].value)
  }

  /** A cross-field error can sit on an earlier step: open the first step that has one */
  const onInvalid = (errors: FieldErrors<TEmployeeSchema>) => {
    const failed = steps.find((s) => EMPLOYEE_STEP_FIELDS[s.value].some((key) => key in errors))
    if (failed) setStep(failed.value)
  }

  const backTo = isCreate
    ? company.companyId
      ? `${ROUTES.EMPLOYEES}?companyId=${company.companyId}`
      : ROUTES.EMPLOYEES
    : ROUTES.EMPLOYEE_DETAIL(id)

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          to={backTo}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
          aria-label={t(isCreate ? 'employee.back_to_list' : 'employee.back_to_profile')}
        >
          <ArrowLeft />
        </Link>
        <div>
          <h1 className='text-xl font-semibold'>
            {isCreate ? t('employee.create_title') : t('employee.edit_title', { name: detail?.fullName ?? '' })}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {t('employee.step_of', { current: stepIndex + 1, total: steps.length })}
            {!isCreate && detail?.employeeNo && ` · ${detail.employeeNo}`}
            {isCreate && ` · ${t('employee.employee_no_hint')}`}
          </p>
        </div>
      </div>

      {isCreate && company.isSuperAdmin && <CompanyPicker />}

      {isError ? (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
          {t('employee.not_found')}
        </div>
      ) : !isCreate && isLoadingDetail ? (
        <Skeleton className='h-96 w-full' />
      ) : !isReady ? (
        company.isSuperAdmin && <PickCompanyHint />
      ) : (
        <form
          aria-label={isCreate ? t('employee.create_title') : t('employee.edit_form')}
          className='flex min-w-0 flex-col gap-4'
          onSubmit={form.handleSubmit((values) => save(values), onInvalid)}
          noValidate
        >
          <div className='bg-card rounded-xl border p-4'>
            <EmployeeStepper steps={steps} current={step} onSelect={setStep} />
          </div>

          {step === EEmployeeStep.Personal && (
            <StepPersonal
              form={form}
              currentImageUrl={isImageRemoved ? undefined : detail?.profileImageUrl}
              onRemoveCurrentImage={() => setIsImageRemoved(true)}
            />
          )}
          {step === EEmployeeStep.Work && (
            <StepWork form={form} companyId={companyId} employeeId={id} current={detail} />
          )}
          {step === EEmployeeStep.Banking && <StepBanking form={form} canEditBanking={canEditBanking} />}
          {step === EEmployeeStep.Account && <StepAccount form={form} documentTypes={documentTypes} />}

          <div className='bg-card flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4'>
            <p className='text-muted-foreground text-sm'>{t('employee.required_hint')}</p>
            <div className='flex gap-2'>
              <Link to={backTo} className={cn(buttonVariants({ variant: 'outline', className: 'h-[38px]' }))}>
                {t('common.cancel')}
              </Link>
              {stepIndex > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  className='h-[38px]'
                  onClick={() => setStep(steps[stepIndex - 1].value)}
                >
                  <ChevronLeft />
                  {t('employee.step_back')}
                </Button>
              )}
              {isLastStep ? (
                <Button key='submit' type='submit' className='h-[38px]' disabled={isPending}>
                  {isPending ? t('common.saving') : t(isCreate ? 'employee.submit_create' : 'employee.submit_update')}
                </Button>
              ) : (
                <Button key='next' type='button' className='h-[38px]' onClick={() => void goNext()}>
                  {t('employee.step_next')}
                  <ChevronRight />
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </PageLayout>
  )
}
