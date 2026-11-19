import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { AnnouncementService } from '~/services/announcement.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { IAnnouncementListParams } from '~/shared/models/announcement.model'

export const useGetListAnnouncementApi = createListApiHook(QUERY_KEY.ANNOUNCEMENT.GET_LIST, AnnouncementService.GetList)

export const useGetAnnouncementDetailApi = createDetailApiHook(
  QUERY_KEY.ANNOUNCEMENT.GET_DETAIL,
  AnnouncementService.GetDetail
)

export const useGetAnnouncementStatisticsApi = createDetailApiHook(
  QUERY_KEY.ANNOUNCEMENT.GET_STATISTICS,
  AnnouncementService.GetStatistics
)

/** Counts of the dashboard tabs: same filters as the list, without tab */
export const useAnnouncementTabCountsApi = (params: IAnnouncementListParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ANNOUNCEMENT.GET_TAB_COUNTS, params],
    queryFn: () => AnnouncementService.GetTabCounts(params),
    select: (res) => res?.data,
    enabled
  })

/** The system categories plus the company's own */
export const useAnnouncementCategoriesApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.ANNOUNCEMENT.GET_CATEGORIES, companyId],
    queryFn: () => AnnouncementService.GetCategories(companyId),
    select: (res) => res?.data ?? [],
    enabled
  })

/** Every announcement read is stale after a write */
export const useInvalidateAnnouncements = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(Object.values(QUERY_KEY.ANNOUNCEMENT).map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}
