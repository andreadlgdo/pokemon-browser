import { describe, expect, it } from 'vitest'
import { HttpError } from '@/services/pokemonApi'
import { mapApiError } from '@/utils/mapApiError'

describe('mapApiError', () => {
  it('classifies 404 as not_found', () => {
    expect(mapApiError(new HttpError(404))).toMatchObject({
      kind: 'not_found',
      retryable: false,
    })
  })

  it('classifies 429 as rate_limit', () => {
    expect(mapApiError(new HttpError(429))).toMatchObject({
      kind: 'rate_limit',
      retryable: true,
    })
  })

  it('classifies 5xx as server', () => {
    expect(mapApiError(new HttpError(503))).toMatchObject({
      kind: 'server',
      retryable: true,
    })
  })

  it('classifies AbortError as timeout', () => {
    expect(mapApiError(new DOMException('The operation was aborted.', 'AbortError'))).toMatchObject(
      {
        kind: 'timeout',
        retryable: true,
      },
    )
  })

  it('classifies TypeError as network', () => {
    expect(mapApiError(new TypeError('Failed to fetch'))).toMatchObject({
      kind: 'network',
      retryable: true,
    })
  })

  it('classifies unknown errors as unknown', () => {
    expect(mapApiError('boom')).toMatchObject({
      kind: 'unknown',
      retryable: false,
    })
  })
})
