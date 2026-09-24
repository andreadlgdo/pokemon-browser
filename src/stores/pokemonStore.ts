import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getPokemon, getPokemonByType, getPokemonList, getTypes } from '@/services/pokemonApi'
import type { PokemonRef, PokemonDetail } from '@/types/pokemon'
import type { AppError } from '@/types/error'
import { mapApiError } from '@/utils/mapApiError'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export const usePokemonStore = defineStore('pokemon', () => {
  // ---------- STATE ----------
  const allPokemon = ref<PokemonRef[]>([])
  const types = ref<string[]>([])
  const typeIndex = ref<Record<string, PokemonRef[]>>({})
  const detailsByName = ref<Record<string, PokemonDetail>>({})

  const searchQuery = ref('')
  const selectedType = ref<string | null>(null)
  const currentPage = ref(1)
  const pageSize = 20

  const bootstrapStatus = ref<Status>('idle')
  const pageDetailsStatus = ref<Status>('idle')
  const detailStatus = ref<Status>('idle')
  const error = ref<AppError | null>(null)
  const detailError = ref<AppError | null>(null)

  let detailToken = 0
  let pageDetailsToken = 0

  // ---------- GETTERS ----------
  const catalog = computed(() =>
    selectedType.value ? (typeIndex.value[selectedType.value] ?? []) : allPokemon.value,
  )

  const filteredPokemon = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return q ? catalog.value.filter((p) => p.name.includes(q)) : catalog.value
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredPokemon.value.length / pageSize)))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredPokemon.value.slice(start, start + pageSize)
  })

  // ---------- ACTIONS ----------
  async function bootstrap() {
    if (bootstrapStatus.value === 'ready') return

    bootstrapStatus.value = 'loading'
    error.value = null

    try {
      const [list, typeList] = await Promise.all([getPokemonList(), getTypes()])
      allPokemon.value = list
      types.value = typeList
      bootstrapStatus.value = 'ready'
    } catch (e: unknown) {
      error.value = mapApiError(e)
      bootstrapStatus.value = 'error'
    }
  }

  async function loadTypePokemon(type: string) {
    if (type in typeIndex.value) return

    error.value = null

    try {
      typeIndex.value[type] = await getPokemonByType(type)
    } catch (e: unknown) {
      if (selectedType.value !== type) return
      error.value = mapApiError(e)
    }
  }

  async function ensurePageDetails() {
    const token = ++pageDetailsToken
    const missing = paginatedItems.value
      .filter((p) => !(p.name in detailsByName.value))
      .map((p) => p.name)

    if (missing.length === 0) {
      if (token !== pageDetailsToken) return
      pageDetailsStatus.value = 'idle'
      const typePending = selectedType.value !== null && !(selectedType.value in typeIndex.value)
      if (!typePending) error.value = null
      return
    }

    pageDetailsStatus.value = 'loading'
    error.value = null

    let firstError: unknown = null

    for (let i = 0; i < missing.length; i += 5) {
      if (token !== pageDetailsToken) return

      const batch = missing.slice(i, i + 5)
      const results = await Promise.allSettled(batch.map((name) => getPokemon(name)))

      results.forEach((result, j) => {
        const name = batch[j]
        if (name === undefined) return
        if (result.status === 'fulfilled') detailsByName.value[name] = result.value
        else if (firstError === null) firstError = result.reason
      })
    }

    if (token !== pageDetailsToken) return

    if (firstError !== null) {
      error.value = mapApiError(firstError)
      pageDetailsStatus.value = 'error'
    } else {
      pageDetailsStatus.value = 'idle'
    }
  }

  async function loadPokemonDetail(name: string) {
    const token = ++detailToken
    detailError.value = null

    if (name in detailsByName.value) {
      detailStatus.value = 'ready'
      return
    }

    detailStatus.value = 'loading'

    try {
      const pokemon = await getPokemon(name)
      detailsByName.value[name] = pokemon
      if (token !== detailToken) return
      detailStatus.value = 'ready'
    } catch (e: unknown) {
      if (token !== detailToken) return
      detailError.value = mapApiError(e)
      detailStatus.value = 'error'
    }
  }

  function setSearch(q: string) {
    searchQuery.value = q
    currentPage.value = 1
  }

  function setType(t: string | null) {
    selectedType.value = t
    currentPage.value = 1
    error.value = null
  }

  function setPage(p: number) {
    currentPage.value = p
  }

  return {
    allPokemon,
    types,
    typeIndex,
    detailsByName,
    searchQuery,
    selectedType,
    currentPage,
    pageSize,
    bootstrapStatus,
    pageDetailsStatus,
    detailStatus,
    error,
    detailError,
    catalog,
    filteredPokemon,
    totalPages,
    paginatedItems,
    bootstrap,
    loadTypePokemon,
    ensurePageDetails,
    loadPokemonDetail,
    setSearch,
    setType,
    setPage,
  }
})
