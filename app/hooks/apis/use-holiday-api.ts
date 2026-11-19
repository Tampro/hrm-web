import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { HolidayService } from '~/services/holiday.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'
import type { IHolidayCalendarParams } from '~/shared/models/holiday.model'

export const useGetListHolidayApi = createListApiHook(QUERY_KEY.HOLIDAY.GET_LIST, HolidayService.GetList)

export const useGetHolidayDetailApi = createDetailApiHook(QUERY_KEY.HOLIDAY.GET_DETAIL, HolidayService.GetDetail)

/** Calendar range; keeps the previous range on screen while the next one loads */
export const useHolidayCalendarApi = (params: IHolidayCalendarParams, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.HOLIDAY.GET_CALENDAR, params],
    queryFn: () => HolidayService.GetCalendar(params),
    select: (res) => res?.data ?? [],
    placeholderData: keepPreviousData,
    enabled
  })

/** The 4 system categories plus the company's own */
export const useHolidayCategoriesApi = (companyId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: [QUERY_KEY.HOLIDAY.GET_CATEGORIES, companyId],
    queryFn: () => HolidayService.GetCategories(companyId),
    select: (res) => res?.data ?? [],
    enabled
  })

/** Every holiday read is stale after a write (list, calendar, detail, categories) */
export const useInvalidateHolidays = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(Object.values(QUERY_KEY.HOLIDAY).map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}
