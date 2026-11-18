import { useLocation, useNavigate } from 'react-router'

import { Badge } from '~/components/ui/badge'
import { Tabs as TabsRoot, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'
import type { ITabItem } from '~/shared/models/common.model'

interface IProps {
  items: ITabItem[]
  listClassName?: string
}

/**
 * Tabs that are separate routes (shadcn Tabs, line variant). The active tab is the longest route that prefixes the
 * current path, so nested pages keep their section tab active.
 */
export function Tabs({ items, listClassName }: IProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = [...items]
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`))

  return (
    <TabsRoot value={active?.route ?? null} onValueChange={(route) => navigate(String(route))}>
      <TabsList variant='line' className={cn('border-b', listClassName)}>
        {items.map((item) => (
          <TabsTrigger key={item.route} value={item.route} className='px-3'>
            {item.label}
            {item.count !== undefined && <Badge variant='secondary'>{item.count}</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
    </TabsRoot>
  )
}
