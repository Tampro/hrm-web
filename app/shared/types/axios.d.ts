import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Don't toast the error of this request */
    _silent?: boolean
    /** Set by the 401 interceptor so a request is retried at most once */
    _retry?: boolean
  }
}
