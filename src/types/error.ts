export type AppErrorKind = 'not_found' | 'network' | 'timeout' | 'rate_limit' | 'server' | 'unknown'

export interface AppError {
  kind: AppErrorKind
  message: string
  retryable: boolean
  status?: number
}
