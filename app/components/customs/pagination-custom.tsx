import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '~/hooks/use-pagination'

interface IProps {
  /** 1-based */
  page: number
  size: number
  totalPage: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

/** Pages to show: first, last, current ±1, with gaps marked by null */
const getPageItems = (page: number, totalPage: number): (number | null)[] => {
  const pages = new Set([1, totalPage, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPage))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

export function PaginationCustom({ page, size, totalPage, onPageChange, onSizeChange }: IProps) {
  const { t } = useTranslation()
  const last = Math.max(totalPage, 1)

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      <span className='text-muted-foreground text-sm'>{t('table.rows_per_page')}</span>
      <Select value={String(size)} onValueChange={(value) => onSizeChange(Number(value))}>
        <SelectTrigger className='w-20' aria-label={t('table.rows_per_page')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <nav className='flex items-center gap-1' aria-label={t('table.pagination')}>
        <Button
          variant='outline'
          size='icon-sm'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('table.previous')}
        >
          <ChevronLeft />
        </Button>
        {getPageItems(page, last).map((item, index) =>
          item === null ? (
            <span key={`gap-${index}`} className='text-muted-foreground px-1'>
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'ghost'}
              size='icon-sm'
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Button>
          )
        )}
        <Button
          variant='outline'
          size='icon-sm'
          disabled={page >= last}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('table.next')}
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  )
}
