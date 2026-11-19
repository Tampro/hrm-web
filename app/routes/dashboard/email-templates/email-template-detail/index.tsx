import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Copy, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { TabsCustom } from '~/components/customs/tab-custom'
import { FormInputField } from '~/components/forms/form-input-field'
import { FormTextareaField } from '~/components/forms/form-textarea-field'
import { Badge } from '~/components/ui/badge'
import { Button, buttonVariants } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { getEmailTemplateName } from '~/helpers/columns/email-template-mgt-column'
import {
  getEmailTemplateContentSchema,
  getEmailTemplateSettingsSchema,
  type TEmailTemplateContentSchema,
  type TEmailTemplateSettingsSchema
} from '~/helpers/schemas/email-template.schema'
import { useGetEmailTemplateDetailApi, useInvalidateEmailTemplates } from '~/hooks/apis/use-email-template-api'
import { useMutationApi } from '~/hooks/use-mutation-api'
import { useQueryParams } from '~/hooks/use-query-params'
import { PageLayout } from '~/layouts/page.layout'
import { EmailTemplateService } from '~/services/email-template.service'
import { DATA } from '~/shared/constants/data.constant'
import { ROUTES } from '~/shared/constants/routes.constant'
import { EEmailTemplateContentFormKey, EEmailTemplateSettingsFormKey } from '~/shared/enums/form.enum'

import { SettingsCard } from '../../settings/components/settings-card'
import { EmailPreviewDialog } from './components/email-preview-dialog'

/** Spec: EmailTemplateService.LANGUAGES */
const LANGUAGES = ['vi', 'en', 'ko']

export function meta() {
  return [{ title: 'Email template · SPECOM HRM' }]
}

// Manual 3.3.1 edit page: settings (name fixed, From Name), content per language, available variables.
// Spec: GET /{id}, PUT /{id}/settings, PUT /{id}/content/{lang}, GET /{id}/preview/{lang}
export default function EmailTemplateDetailPage() {
  // Lib
  const { t } = useTranslation()
  const { id } = useParams()
  const invalidate = useInvalidateEmailTemplates()
  const { searchParams } = useQueryParams()
  const tabParam = searchParams.get('tab') ?? ''
  const [lang, setLang] = useState(LANGUAGES.includes(tabParam) ? tabParam : LANGUAGES[0])
  const [previewLang, setPreviewLang] = useState<string | undefined>()

  // API
  const { detail, isLoading, isError } = useGetEmailTemplateDetailApi({ id })
  const template = detail?.template
  const saved = detail?.contents?.find((c) => c.lang === lang)

  // Form
  const settingsForm = useForm<TEmailTemplateSettingsSchema>({
    defaultValues: { fromName: '' },
    resolver: zodResolver(getEmailTemplateSettingsSchema(t)),
    mode: 'all'
  })
  const contentForm = useForm<TEmailTemplateContentSchema>({
    defaultValues: { subject: '', content: '' },
    resolver: zodResolver(getEmailTemplateContentSchema(t)),
    mode: 'all'
  })

  useEffect(() => {
    settingsForm.reset({ fromName: template?.fromName ?? '' })
  }, [template, settingsForm])

  // switching language (or a refetch after save) shows that language's saved text; unsaved edits are dropped
  useEffect(() => {
    contentForm.reset({ subject: saved?.subject ?? '', content: saved?.content ?? '' })
  }, [saved, lang, contentForm])

  const onSaved = async () => {
    toast.success(t('settings.saved'))
    await invalidate()
  }
  const { mutate: saveFromName, isPending: isSavingFromName } = useMutationApi({
    mutationFn: (values: TEmailTemplateSettingsSchema) => EmailTemplateService.SaveFromName(id ?? '', values.fromName),
    onSuccess: onSaved
  })
  const { mutate: saveContent, isPending: isSavingContent } = useMutationApi({
    mutationFn: (values: TEmailTemplateContentSchema) => EmailTemplateService.SaveContent(id ?? '', lang, values),
    onSuccess: onSaved
  })

  const copyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(`{${variable}}`)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copy_failed'))
    }
  }

  const isContentDirty = contentForm.formState.isDirty

  return (
    <PageLayout>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          to={ROUTES.EMAIL_TEMPLATES}
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label={t('email_template.back')}
        >
          <ArrowLeft />
        </Link>
        <div>
          {isLoading ? (
            <Skeleton className='h-7 w-56' />
          ) : (
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-xl font-semibold'>{template ? getEmailTemplateName(t, template) : '-'}</h1>
              {detail?.toggleableByCompany && <Badge variant='secondary'>{t('email_template.toggleable')}</Badge>}
            </div>
          )}
          <p className='text-muted-foreground font-mono text-sm'>{template?.code || '-'}</p>
        </div>
      </div>

      {isError ? (
        <div className='bg-card text-muted-foreground rounded-xl border p-10 text-center'>
          {t('email_template.not_found')}
        </div>
      ) : (
        <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='flex min-w-0 flex-col gap-4'>
            <SettingsCard
              title={t('email_template.settings_title')}
              loading={isLoading}
              saving={isSavingFromName}
              onSubmit={settingsForm.handleSubmit((values) => saveFromName(values))}
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='email-template-name'>{t('email_template.field.name')}</FieldLabel>
                  <Input
                    id='email-template-name'
                    value={template ? getEmailTemplateName(t, template) : ''}
                    readOnly
                    disabled
                    className='h-[38px]'
                  />
                </Field>
                <FormInputField
                  control={settingsForm.control}
                  name={EEmailTemplateSettingsFormKey.FromName}
                  label={t('email_template.field.from_name')}
                  description={t('email_template.from_name_hint')}
                  required
                />
              </div>
            </SettingsCard>

            <SettingsCard
              title={t('email_template.content_title')}
              description={t('email_template.content_description')}
              loading={isLoading}
              saving={isSavingContent}
              onSubmit={contentForm.handleSubmit((values) => saveContent(values))}
              actions={
                <Button
                  type='button'
                  variant='outline'
                  className='h-[38px]'
                  disabled={!saved || isContentDirty}
                  title={isContentDirty ? t('email_template.preview.save_first') : undefined}
                  onClick={() => setPreviewLang(lang)}
                >
                  <Eye />
                  {t('email_template.preview.open')}
                </Button>
              }
            >
              <TabsCustom value={lang} onChange={setLang} options={DATA.GET_LANGUAGE_OPTIONS(t)} />
              {!saved && (
                <p role='note' className='rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
                  {t('email_template.no_content')}
                </p>
              )}
              <FormInputField
                control={contentForm.control}
                name={EEmailTemplateContentFormKey.Subject}
                label={t('email_template.field.subject')}
                required
              />
              <FormTextareaField
                control={contentForm.control}
                name={EEmailTemplateContentFormKey.Content}
                label={t('email_template.field.content')}
                description={t('email_template.content_hint')}
                rows={12}
              />
            </SettingsCard>
          </div>

          <aside aria-label={t('email_template.variables_title')} className='bg-card rounded-xl border p-4'>
            <h2 className='font-semibold'>{t('email_template.variables_title')}</h2>
            <p className='text-muted-foreground mb-3 text-sm'>{t('email_template.variables_hint')}</p>
            <ul className='flex flex-col gap-1'>
              {(detail?.variables ?? []).map((variable) => (
                <li key={variable}>
                  <Button
                    type='button'
                    variant='ghost'
                    className='w-full justify-between font-mono text-sm'
                    aria-label={t('email_template.copy_variable', { name: `{${variable}}` })}
                    onClick={() => void copyVariable(variable)}
                  >
                    {`{${variable}}`}
                    <Copy className='text-muted-foreground' />
                  </Button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      <EmailPreviewDialog templateId={id} lang={previewLang} onClose={() => setPreviewLang(undefined)} />
    </PageLayout>
  )
}
