import { commonHelper } from '~/helpers/common.helper'
import { DEFAULT_PAGE, DEFAULT_SIZE } from '~/hooks/use-pagination'
import { ECompanyStatus } from '~/shared/enums/company.enum'
import type { TCompanyFilterSchema } from '~/helpers/schema.helper'

const pick = (searchParams: URLSearchParams, key: string, fallback: string) => searchParams.get(key) ?? fallback

export const paramsHelper = {
  paginationToSearchParams: (searchParams: URLSearchParams) => ({
    page: commonHelper.toPositiveInt(searchParams.get('page'), DEFAULT_PAGE),
    size: commonHelper.toPositiveInt(searchParams.get('size'), DEFAULT_SIZE)
  }),

  /** Every param the companies page owns; values already in the URL win over defaults */
  companyToSearchParams: (searchParams: URLSearchParams, defaults: TCompanyFilterSchema, tab: ECompanyStatus) => ({
    ...paramsHelper.paginationToSearchParams(searchParams),
    keyword: pick(searchParams, 'keyword', defaults.keyword),
    createdFrom: pick(searchParams, 'createdFrom', defaults.createdFrom),
    createdTo: pick(searchParams, 'createdTo', defaults.createdTo),
    tab
  }),

  /** Tab from ?tab=, falls back to All for unknown values */
  getCompanyTab: (searchParams: URLSearchParams) => {
    const tab = searchParams.get('tab')
    return Object.values(ECompanyStatus).includes(tab as ECompanyStatus) ? (tab as ECompanyStatus) : ECompanyStatus.All
  }
}
