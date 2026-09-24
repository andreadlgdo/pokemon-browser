import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePokemonStore } from '@/stores/pokemonStore'
import type { PokemonRef } from '@/types/pokemon'

const catalog: PokemonRef[] = [
  ...Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `poke${i + 1}` })),
  { id: 999, name: 'pikachu' },
]

describe('usePokemonStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('searches the full catalog before pagination', () => {
    const store = usePokemonStore()
    store.allPokemon = catalog

    expect(store.paginatedItems.some((p) => p.name === 'pikachu')).toBe(false)

    store.setPage(6)
    expect(store.paginatedItems[0]?.name).toBe('pikachu')

    store.setPage(1)
    store.setSearch('pika')

    expect(store.filteredPokemon).toHaveLength(1)
    expect(store.filteredPokemon[0]?.name).toBe('pikachu')
    expect(store.paginatedItems[0]?.name).toBe('pikachu')
    expect(store.currentPage).toBe(1)
  })

  it('resets currentPage to 1 when search changes', () => {
    const store = usePokemonStore()
    store.allPokemon = catalog

    store.setPage(5)
    store.setSearch('char')

    expect(store.currentPage).toBe(1)
  })

  it('resets currentPage to 1 when type filter changes', () => {
    const store = usePokemonStore()
    store.allPokemon = catalog

    store.setPage(5)
    store.setType('fire')

    expect(store.currentPage).toBe(1)
  })
})
