import type { TFunction } from 'i18next'

import type { IColumn } from '~/components/customs/table-custom'
import { dateHelper } from '~/helpers/date.helper'
import type { IEmailTemplate } from '~/shared/models/email-template.model'

/** Seeded names are English; show the translated name per code, fall back to the backend name */
export const getEmailTemplateName = (t: TFunction, row?: IEmailTemplate) =>
  row?.code ? t(`email_template.name.${row.code}`, { defaultValue: row.name || row.code }) : row?.name || '-'

export const emailTemplateMgtColumn = {
  // List: name, From Name, created date. A row opens the editor.
  getEmailTemplate: (t: TFunction): IColumn<IEmailTemplate>[] => [
    {
      id: 'name',
      header: t('email_template.field.name'),
      cell: (row) => <span className='font-medium'>{getEmailTemplateName(t, row)}</span>
    },
    {
      id: 'fromName',
      header: t('email_template.field.from_name'),
      cell: (row) => <span className='font-mono text-sm'>{row.fromName || '-'}</span>
    },
    {
      id: 'createdDate',
      header: t('email_template.field.created_date'),
      cell: (row) => dateHelper.formatDate(row.createdDate)
    }
  ]
}
