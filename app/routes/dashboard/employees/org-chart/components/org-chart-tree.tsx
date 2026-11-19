import { Building2, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Avatar } from '~/components/customs/avatar-custom'
import { cn } from '~/lib/utils'
import { ROUTES } from '~/shared/constants/routes.constant'
import type { IOrgChartNode } from '~/shared/models/employee.model'

import { StatusDot } from './status-dot'

/** Vertical connector between a card and the row of its reports */
const Stem = () => <div aria-hidden className='bg-border h-5 w-px' />

/**
 * Row of children under one parent: each child gets a short vertical line, and a horizontal line joins them
 * (half line on the first and last child so the bar stops at their centre).
 */
function Branches({ nodes }: { nodes: IOrgChartNode[] }) {
  return (
    <ul className='flex justify-center'>
      {nodes.map((node, index) => (
        <li key={node.id} className='relative flex flex-col items-center px-3 pt-5'>
          {nodes.length > 1 && (
            <span
              aria-hidden
              className={cn(
                'bg-border absolute top-0 h-px',
                index === 0 ? 'right-0 left-1/2' : index === nodes.length - 1 ? 'right-1/2 left-0' : 'right-0 left-0'
              )}
            />
          )}
          <span aria-hidden className='bg-border absolute top-0 left-1/2 h-5 w-px' />
          <TreeNode node={node} />
        </li>
      ))}
    </ul>
  )
}

/** Card + collapse toggle + (when expanded) the people who report to this one */
function TreeNode({ node }: { node: IOrgChartNode }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const children = node.children ?? []

  return (
    <div className='flex flex-col items-center'>
      <Link
        to={ROUTES.EMPLOYEE_DETAIL(node.id ?? '')}
        className='bg-card hover:border-primary relative flex w-44 flex-col items-center gap-1 rounded-lg border px-3 pt-4 pb-3 text-center shadow-sm transition-colors'
      >
        <StatusDot active={node.active} className='absolute top-2 right-2' />
        <Avatar name={node.fullName} src={node.profileImageUrl} size='lg' />
        <span className='w-full truncate text-sm font-medium'>{node.fullName || '-'}</span>
        <span className='text-muted-foreground w-full truncate text-xs'>{node.designation || '-'}</span>
      </Link>
      {children.length > 0 && (
        <>
          <button
            type='button'
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={t(expanded ? 'employee.org_chart.collapse' : 'employee.org_chart.expand', {
              name: node.fullName ?? '',
              count: children.length
            })}
            className='bg-background hover:border-primary relative z-10 -mt-2.5 flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold'
          >
            {expanded ? <ChevronUp className='size-3' /> : children.length}
          </button>
          {expanded && (
            <>
              <Stem />
              <Branches nodes={children} />
            </>
          )}
        </>
      )}
    </div>
  )
}

interface IProps {
  companyName?: string
  members?: number
  nodes: IOrgChartNode[]
  /** zoom factor (1 = 100%) */
  scale: number
}

/** Visual hierarchy view: company on top, each employee under the person they report to, connected by lines */
export function OrgChartTree({ companyName, members, nodes, scale }: IProps) {
  const { t } = useTranslation()

  return (
    <div className='overflow-auto'>
      {/* inline-flex + min-w-full: centred when it fits, scrollable when the tree is wider than the screen */}
      <div
        role='group'
        aria-label={t('employee.org_chart.tree_label')}
        className='inline-flex min-w-full origin-top justify-center p-4 transition-transform'
        style={{ transform: `scale(${scale})` }}
      >
        <div className='flex flex-col items-center'>
          <div className='bg-primary text-primary-foreground flex w-56 items-center gap-3 rounded-lg p-3 shadow-sm'>
            <Building2 className='size-5 shrink-0' />
            <span className='min-w-0'>
              <span className='block truncate font-semibold'>{companyName || '-'}</span>
              <span className='block text-xs opacity-80'>
                {t('employee.org_chart.members', { count: members ?? 0 })}
              </span>
            </span>
          </div>
          {nodes.length > 0 ? (
            <>
              <Stem />
              <Branches nodes={nodes} />
            </>
          ) : (
            <p className='text-muted-foreground mt-4 text-sm'>{t('employee.org_chart.empty')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
