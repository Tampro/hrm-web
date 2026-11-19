import { useQueryClient } from '@tanstack/react-query'

import { createDetailApiHook, createListApiHook } from '~/hooks/use-query-api'
import { EmailTemplateService } from '~/services/email-template.service'
import { QUERY_KEY } from '~/shared/constants/query-key.constant'

export const useGetListEmailTemplateApi = createListApiHook(
  QUERY_KEY.EMAIL_TEMPLATE.GET_LIST,
  EmailTemplateService.GetList
)

export const useGetEmailTemplateDetailApi = createDetailApiHook(
  QUERY_KEY.EMAIL_TEMPLATE.GET_DETAIL,
  EmailTemplateService.GetDetail
)

/** After a save: list (From Name column), detail and every cached preview are stale */
export const useInvalidateEmailTemplates = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      Object.values(QUERY_KEY.EMAIL_TEMPLATE).map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    )
}
