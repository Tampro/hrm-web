import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Avatar } from '~/components/customs/avatar-custom'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { IOrgChartNode } from '~/shared/models/employee.model'

import { StatusDot } from './status-dot'

/** One person and, below, the people who report to them (nested list = the tree's structure for screen readers) */
function ListNode({ node }: { node: IOrgChartNode }) {
  return (
    <li className='flex flex-col gap-2'>
      <Link
        to={ROUTES.EMPLOYEE_DETAIL(node.id ?? '')}
        className='bg-card hover:border-primary flex w-72 max-w-full items-center gap-3 rounded-lg border p-3 transition-colors'
      >
        <Avatar name={node.fullName} src={node.profileImageUrl} />
        <span className='min-w-0 flex-1'>
          <span className='block truncate font-medium'>{node.fullName || '-'}</span>
          <span className='text-muted-foreground block truncate text-xs'>{node.designation || '-'}</span>
        </span>
        <StatusDot active={node.active} />
      </Link>
      {!!node.children?.length && (
        <ul className='border-border ml-6 flex flex-col gap-2 border-l pl-6'>
          {node.children.map((child) => (
            <ListNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** List view: indented outline, one card per person */
export function OrgChartList({ nodes }: { nodes: IOrgChartNode[] }) {
  const { t } = useTranslation()
  return nodes.length ? (
    <ul className='ml-6 flex flex-col gap-2 border-l pl-6'>
      {nodes.map((node) => (
        <ListNode key={node.id} node={node} />
      ))}
    </ul>
  ) : (
    <p className='text-muted-foreground text-sm'>{t('employee.org_chart.empty')}</p>
  )
}
