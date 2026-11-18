import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useMutationApi } from '~/hooks/use-mutation-api'
import { SettingsService } from '~/services/settings.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { ESettingsSection } from '~/shared/enums/settings.enum'

/**
 * One settings section: GET for the form, PUT to save (full replacement), toast + refetch on success.
 * Errors are toasted by axiosClient.
 */
export const useSettingsSection = <TView, TPayload>(section: ESettingsSection) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = [QUERY_KEY.SETTINGS.GET_SECTION, section]

  const query = useQuery({
    queryKey,
    queryFn: () => SettingsService.GetSection<TView>(section),
    select: (res) => res?.data
  })

  const mutation = useMutationApi({
    mutationFn: (payload: TPayload) => SettingsService.UpdateSection<TView>(section, payload),
    onSuccess: async () => {
      toast.success(t('settings.saved'))
      await queryClient.invalidateQueries({ queryKey })
    }
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    save: mutation.mutate,
    isSaving: mutation.isPending
  }
}
