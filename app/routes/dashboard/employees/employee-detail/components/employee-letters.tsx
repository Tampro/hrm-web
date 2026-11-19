import { FileText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { commonHelper } from '~/helpers/common.helper'
import { EmployeeService } from '~/services/employee.service'
import { DATA } from '~/shared/constants/data.constant'
import type { ELetterType } from '~/shared/enums/employee.enum'
import type { IEmployeeDetail } from '~/shared/models/employee.model'

/** Spec: lang vi (default) or en; ko is served in en (no Korean font bundled), so it is not offered */
const LETTER_LANGUAGES = ['vi', 'en'] as const

// Spec: GET /employees/{id}/letters/{type}?lang= → PDF (Certifications tab)
export function EmployeeLetters({ employee }: { employee: IEmployeeDetail }) {
  const { t } = useTranslation()
  const [lang, setLang] = useState<string>('vi')
  const [downloading, setDownloading] = useState<ELetterType | undefined>()
  const languages = LETTER_LANGUAGES.map((l) => ({ label: t(`settings.language.${l}`), value: l }))

  const download = async (type: ELetterType) => {
    setDownloading(type)
    try {
      const blob = await EmployeeService.GetLetter(employee.id ?? '', type, lang)
      commonHelper.downloadBlob(blob, `${employee.employeeNo ?? 'employee'}-${type.toLowerCase()}-${lang}.pdf`)
    } catch {
      // axiosClient already showed the error toast
    } finally {
      setDownloading(undefined)
    }
  }

  return (
    <section
      aria-label={t('employee.detail_tab.letters')}
      className='bg-card flex flex-col gap-4 rounded-xl border p-5'
    >
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='font-semibold'>{t('employee.detail_tab.letters')}</h2>
          <p className='text-muted-foreground text-sm'>{t('employee.letter.description')}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <label htmlFor='letter-lang' className='text-sm font-medium'>
            {t('employee.letter.language')}
          </label>
          <Select items={languages} value={lang} onValueChange={(v) => v && setLang(v)}>
            <SelectTrigger id='letter-lang' className='h-[38px] w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ul className='grid gap-3 md:grid-cols-3'>
        {DATA.GET_LETTER_OPTIONS(t).map((letter) => (
          <li key={letter.value} className='flex flex-col gap-3 rounded-lg border p-4'>
            <div className='flex items-center gap-2 font-medium'>
              <FileText className='text-primary size-5' />
              {letter.label}
            </div>
            <Button
              variant='outline'
              className='h-[38px]'
              disabled={!!downloading}
              onClick={() => void download(letter.value)}
            >
              {downloading === letter.value ? t('employee.letter.downloading') : t('employee.letter.download')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
