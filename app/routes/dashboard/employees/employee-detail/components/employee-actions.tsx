import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Lock, MoreHorizontal, RefreshCw, Trash2, Unlock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { AlertDialogCustom } from '~/components/customs/alert-dialog-custom'
import { FormInputField } from '~/components/forms/form-input-field'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { getEmployeePasswordSchema, type TEmployeePasswordSchema } from '~/helpers/schemas/employee.schema'
import { useInvalidateEmployees } from '~/hooks/apis/use-employee-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { EmployeeService } from '~/services/employee.service'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EEmployeeStatus } from '~/shared/enums/employee.enum'
import { EEmployeePasswordFormKey } from '~/shared/enums/form.enum'
import type { IEmployeeDetail } from '~/shared/models/employee.model'

type TDialog = 'status' | 'login' | 'password' | 'delete'

interface IProps {
  employee: IEmployeeDetail
}

// Spec: PUT /{id}/status · PUT /{id}/login (off locks the IAM account and ends its sessions) ·
// PUT /{id}/password (permanent, realm policy) · DELETE /{id} (login locked first, then removed from every list)
export function EmployeeActions({ employee }: IProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const invalidate = useInvalidateEmployees()
  const [dialog, setDialog] = useState<TDialog | undefined>()
  const [status, setStatus] = useState<string>(employee.status ?? EEmployeeStatus.Active)
  const id = employee.id ?? ''
  const hasAccount = !!employee.userId
  const close = () => setDialog(undefined)

  const passwordForm = useForm<TEmployeePasswordSchema>({
    defaultValues: { newPassword: '', confirmPassword: '' },
    resolver: zodResolver(getEmployeePasswordSchema(t)),
    mode: 'all'
  })

  const done = (message: string) => async () => {
    toast.success(message)
    await invalidate()
    close()
  }

  const statusMutation = useMutationApi({
    mutationFn: () => EmployeeService.UpdateStatus(id, status as EEmployeeStatus),
    onSuccess: done(t('employee.toast.status_changed'))
  })
  const loginMutation = useMutationApi({
    mutationFn: () => EmployeeService.UpdateLogin(id, !employee.loginEnabled),
    onSuccess: done(t(employee.loginEnabled ? 'employee.toast.login_off' : 'employee.toast.login_on'))
  })
  const passwordMutation = useMutationApi({
    mutationFn: (values: TEmployeePasswordSchema) => EmployeeService.SetPassword(id, values),
    onSuccess: async () => {
      passwordForm.reset()
      await done(t('employee.toast.password_set'))()
    }
  })
  const deleteMutation = useMutationApi({
    mutationFn: () => EmployeeService.Delete(id),
    onSuccess: async () => {
      toast.success(t('employee.toast.deleted'))
      await invalidate()
      navigate(employee.companyId ? `${ROUTES.EMPLOYEES}?companyId=${employee.companyId}` : ROUTES.EMPLOYEES)
    }
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='outline' size='icon' className='size-[38px]' aria-label={t('employee.action.menu')} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuItem
            onClick={() => {
              setStatus(employee.status ?? EEmployeeStatus.Active)
              setDialog('status')
            }}
          >
            <RefreshCw />
            {t('employee.action.change_status')}
          </DropdownMenuItem>
          {/* Spec: EMP_013 — login and password need an account */}
          <DropdownMenuItem disabled={!hasAccount} onClick={() => setDialog('login')}>
            {employee.loginEnabled ? <Lock /> : <Unlock />}
            {t(employee.loginEnabled ? 'employee.action.login_off' : 'employee.action.login_on')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasAccount} onClick={() => setDialog('password')}>
            <KeyRound />
            {t('employee.action.set_password')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setDialog('delete')}>
            <Trash2 />
            {t('employee.action.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === 'status'} onOpenChange={(open) => !open && !statusMutation.isPending && close()}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('employee.action.change_status')}</DialogTitle>
            <DialogDescription>
              {t('employee.status_dialog.description', { name: employee.fullName ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-2' role='radiogroup' aria-label={t('employee.field.status')}>
            {DATA.GET_EMPLOYEE_STATUS_OPTIONS(t).map((option) => (
              <label
                key={option.value}
                className='has-checked:border-primary has-checked:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm'
              >
                <input
                  type='radio'
                  name='employee-status'
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className='accent-primary'
                />
                {option.label}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' className='h-[38px]' onClick={close} disabled={statusMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              className='h-[38px]'
              disabled={statusMutation.isPending || status === employee.status}
              onClick={() => statusMutation.mutate(undefined)}
            >
              {statusMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        open={dialog === 'login'}
        onOpenChange={(open) => !open && !loginMutation.isPending && close()}
        title={t(employee.loginEnabled ? 'employee.action.login_off' : 'employee.action.login_on')}
        description={t(employee.loginEnabled ? 'employee.login_dialog.off' : 'employee.login_dialog.on', {
          name: employee.fullName ?? ''
        })}
        confirmText={t('common.confirm')}
        isDestructive={employee.loginEnabled}
        loading={loginMutation.isPending}
        onConfirm={() => loginMutation.mutate(undefined)}
      />

      <Dialog
        open={dialog === 'password'}
        onOpenChange={(open) => {
          if (open || passwordMutation.isPending) return
          passwordForm.reset()
          close()
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('employee.action.set_password')}</DialogTitle>
            <DialogDescription>
              {t('employee.password_dialog.description', { name: employee.fullName ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <form
            id='employee-password-form'
            className='flex flex-col gap-4'
            onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}
            noValidate
          >
            <FormInputField
              control={passwordForm.control}
              name={EEmployeePasswordFormKey.NewPassword}
              label={t('employee.field.new_password')}
              type='password'
              autoComplete='new-password'
              required
            />
            <FormInputField
              control={passwordForm.control}
              name={EEmployeePasswordFormKey.ConfirmPassword}
              label={t('employee.field.confirm_password')}
              type='password'
              autoComplete='new-password'
              required
            />
          </form>
          <DialogFooter>
            <Button variant='outline' className='h-[38px]' onClick={close} disabled={passwordMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              type='submit'
              form='employee-password-form'
              className='h-[38px]'
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && !deleteMutation.isPending && close()}
        title={t('employee.delete.title')}
        description={t('employee.delete.description', {
          name: employee.fullName ?? '-',
          employeeNo: employee.employeeNo ?? '-'
        })}
        confirmText={t('common.delete')}
        isDestructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(undefined)}
      />
    </>
  )
}
