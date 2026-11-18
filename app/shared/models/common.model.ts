// Spec: backend ApiMessageDto — the same envelope is used for success (result: true) and errors (result: false)
export interface IApiResponse<T> {
  result?: boolean
  code?: string
  data?: T
  message?: string
  traceId?: string
}

// Spec: backend ResponseListDto
export interface IApiPagination<T> {
  content?: T[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}
