# Pokémon Browser

## Stack

Vite · Vue 3 with `<script setup>` · TypeScript · Pinia · Nuxt UI v4 standalone (Vite plugin).
**No Nuxt.** Do not add new dependencies or a second UI library.

## State

Single store: `stores/pokemonStore.ts`, setup style (`ref` = state, `computed` = getters, functions = actions).
Derived data **never** lives in state:

```ts
// ❌ two sources of truth, they drift apart
const filtered = ref<PokemonRef[]>([])
function setSearch(q: string) { query.value = q; filtered.value = recompute() }

// ✅ cannot drift, and Vue memoizes it
const filtered = computed(() => universe.value.filter(p => p.name.includes(query.value)))
```

Required derivation order: `universe → filteredPokemon → totalPages → paginatedItems`.
Search runs over the full catalog; **paginating is always the last step**, never the first.
`setSearch` and `setType` reset `currentPage` to 1.

## Requests and errors

HTTP lives only in `services/pokemonApi.ts`, built on the `request()` helper with `AbortController` and a timeout.
`fetch` does not reject on 4xx/5xx: check `res.ok` and throw `HttpError`.
Every `catch` receives `unknown` and goes through `mapApiError`. **Never `any`.**

- `Promise.all` when every response is required (bootstrap).
- `Promise.allSettled` when partial failure is acceptable (thumbnails for one page).
- Batches of at most 5 concurrent requests: the public API enforces rate limits.
- Check the cache (`detailsByName`, `typeIndex`) before fetching anything.

## Accessibility

Every interactive control needs an accessible name. Images need a descriptive `alt` plus explicit `width` and `height`.
Navigate with `RouterLink` or `button`, never a `div` with `@click`.

## Do not

Do not create folders or abstractions "just in case" (`composables/`, `repositories/`, `constants/`).
Do not refactor working code. Do not add animations. Do not propose component tests or E2E.
If something cannot be explained in one sentence, simplify it.
