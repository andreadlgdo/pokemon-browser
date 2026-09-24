import type { PokemonDetail } from '@/types/pokemon'

const BASE = 'https://pokeapi.co/api/v2'

export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`)
  }
}

export async function request<T>(path: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal })
    if (!res.ok) throw new HttpError(res.status)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export const getPokemon = (nameOrId: string | number) =>
  request<PokemonDetail>(`/pokemon/${nameOrId}`)
