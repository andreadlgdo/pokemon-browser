import { HttpError } from '@/services/pokemonApi'
import type { AppError } from '@/types/error'

export function mapApiError(e: unknown): AppError {
  if (e instanceof HttpError) {
    if (e.status === 404) {
      return {
        kind: 'not_found',
        message: "We couldn't find that Pokémon.",
        retryable: false,
        status: e.status,
      }
    }
    if (e.status === 429) {
      return {
        kind: 'rate_limit',
        message: 'Too many requests. Wait a moment and try again.',
        retryable: true,
        status: e.status,
      }
    }
    if (e.status >= 500) {
      return {
        kind: 'server',
        message: 'The Pokémon API is having problems. Try again.',
        retryable: true,
        status: e.status,
      }
    }
    return {
      kind: 'unknown',
      message: 'Something went wrong.',
      retryable: false,
      status: e.status,
    }
  }

  if (e instanceof DOMException && e.name === 'AbortError') {
    return {
      kind: 'timeout',
      message: 'The request took too long. Try again.',
      retryable: true,
    }
  }

  if (e instanceof TypeError) {
    return {
      kind: 'network',
      message: 'No connection. Check your network and try again.',
      retryable: true,
    }
  }

  return {
    kind: 'unknown',
    message: 'Something went wrong.',
    retryable: false,
  }
}
