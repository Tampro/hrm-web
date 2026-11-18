import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PaginationCustom } from '~/components/customs/pagination-custom'
import { Skeleton } from '~/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { cn } from '~/lib/utils'

export interface IColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  className?: string
  /** Clicking this cell does not open the detail page (action / checkbox columns) */
  meta?: { disableNavigation?: boolean }
}

interface IProps<T extends { id?: string }> {
  columns: IColumn<T>[]
  data: T[]
  loading?: boolean
  headerTitle?: ReactNode
  headerDescription?: ReactNode
  headerAction?: ReactNode
  /** Total rows across all pages (API totalElements) */
  totalItems?: number
  /** Paging — omit to hide the pagination bar */
  page?: number
  size?: number
  totalPage?: number
  onPageChange?: (page: number) => void
  onSizeChange?: (size: number) => void
  /** Rows navigate to `<id>` by default; set when the list has no detail page */
  disableNavigationAll?: boolean
  emptyText?: ReactNode
}

const SKELETON_ROWS = 5

export function TableCustom<T extends { id?: string }>({
  columns,
  data,
  loading,
  headerTitle,
  headerDescription,
  headerAction,
  totalItems,
  page,
  size,
  totalPage = 0,
  onPageChange,
  onSizeChange,
  disableNavigationAll,
  emptyText
}: IProps<T>) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasPaging = page !== undefined && size !== undefined && onPageChange && onSizeChange

  return (
    <div className='bg-card flex flex-col gap-3 rounded-xl border p-4'>
      {(headerTitle || headerAction || totalItems !== undefined) && (
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            {headerTitle && <h2 className='text-base font-semibold'>{headerTitle}</h2>}
            {headerDescription && <p className='text-muted-foreground text-sm'>{headerDescription}</p>}
            {totalItems !== undefined && (
              <p className='text-muted-foreground text-sm'>
                {t('table.showing', { count: data.length, total: totalItems })}
              </p>
            )}
          </div>
          {headerAction}
        </div>
      )}

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className='h-5 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-muted-foreground h-24 text-center'>
                  {emptyText ?? t('table.empty')}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.map((row, index) => (
                <TableRow
                  key={row.id ?? index}
                  className={cn(!disableNavigationAll && row.id && 'cursor-pointer')}
                  onClick={() => !disableNavigationAll && row.id && navigate(row.id)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={column.className}
                      onClick={(e) => column.meta?.disableNavigation && e.stopPropagation()}
                    >
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {hasPaging && (
        <PaginationCustom
          page={page}
          size={size}
          totalPage={totalPage}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
        />
      )}
    </div>
  )
}
