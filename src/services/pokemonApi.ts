import type {
  PokemonDetail,
  PokemonListResponse,
  PokemonRef,
  TypeListResponse,
  TypeResponse,
} from '@/types/pokemon'

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

export const extractId = (url: string): number => Number(url.split('/').filter(Boolean).pop())

export async function getPokemonList(limit = 1500, offset = 0): Promise<PokemonRef[]> {
  const res = await request<PokemonListResponse>(`/pokemon?limit=${limit}&offset=${offset}`)
  return res.results.map((r) => ({ name: r.name, id: extractId(r.url) }))
}

export async function getTypes(): Promise<string[]> {
  const res = await request<TypeListResponse>('/type')
  return res.results.map((t) => t.name).filter((name) => name !== 'unknown' && name !== 'shadow')
}

export const getPokemon = (nameOrId: string | number) =>
  request<PokemonDetail>(`/pokemon/${nameOrId}`)

export async function getPokemonByType(type: string): Promise<PokemonRef[]> {
  const res = await request<TypeResponse>(`/type/${type}`)
  return res.pokemon.map((e) => ({ name: e.pokemon.name, id: extractId(e.pokemon.url) }))
}
