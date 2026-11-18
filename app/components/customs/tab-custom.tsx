import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useQueryParams } from '~/hooks/use-query-params'
import type { ITabOption } from '~/shared/models/common.model'

interface IProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: ITabOption<T>[]
  /** Keep the tab out of the URL (default: synced to ?tab=) */
  isNoSyncParams?: boolean
}

export function TabsCustom<T extends string>({ value, onChange, options, isNoSyncParams }: IProps<T>) {
  const { updateQuery } = useQueryParams()

  const handleChange = (next: T) => {
    if (!isNoSyncParams) updateQuery('tab', next)
    onChange(next)
  }

  return (
    <Tabs value={value} onValueChange={(next) => handleChange(next as T)}>
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
            {option.count !== undefined && (
              <Badge variant='secondary' className='ml-1.5'>
                {option.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
