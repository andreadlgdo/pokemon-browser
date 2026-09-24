<template>
  <main class="mx-auto max-w-5xl px-4 py-12">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4 shrink-0" aria-hidden="true" />
      Back to list
    </RouterLink>

    <h1 class="mt-6 text-3xl font-semibold capitalize text-primary">{{ pageTitle }}</h1>

    <template v-if="store.detailStatus === 'loading' || store.detailStatus === 'idle'">
      <div class="mt-8 flex flex-col items-center gap-4">
        <USkeleton class="size-50 md:size-64 lg:size-80" />
        <USkeleton class="h-8 w-48" />
        <p class="text-muted">Loading…</p>
      </div>
    </template>

    <template v-else-if="store.detailStatus === 'error' && store.detailError">
      <AppErrorState
        v-if="store.detailError.kind !== 'not_found'"
        class="mt-8"
        :error="store.detailError"
        variant="blocking"
        @retry="store.loadPokemonDetail(route.params.name as string)"
      />
    </template>

    <template v-else-if="store.detailStatus === 'ready' && pokemon">
      <div
        class="mt-8 grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,16rem)_1fr] lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12"
      >
        <aside class="flex flex-col items-center gap-4 md:sticky md:top-8 md:items-start">
          <div class="flex size-50 shrink-0 items-center justify-center md:size-64 lg:size-80">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="`Artwork of ${pokemon.name}`"
              width="320"
              height="320"
              loading="lazy"
              class="size-full object-contain"
            />
            <div v-else class="flex size-full items-center justify-center text-sm text-muted">
              No artwork
            </div>
          </div>

          <div
            v-if="pokemon.types.length"
            class="flex flex-wrap justify-center gap-1 md:justify-start"
          >
            <UBadge
              v-for="t in pokemon.types"
              :key="t.type.name"
              variant="soft"
              class="capitalize"
              :class="typeColorClass(t.type.name)"
            >
              {{ t.type.name }}
            </UBadge>
          </div>
        </aside>

        <div class="min-w-0 space-y-8">
          <section>
            <h2 class="text-lg font-semibold text-primary">Stats</h2>
            <ul class="mt-4 space-y-3">
              <li v-for="s in pokemon.stats" :key="s.stat.name">
                <span class="text-sm text-muted">
                  {{ humanize(s.stat.name) }}
                </span>
                <UProgress
                  color="secondary"
                  :model-value="s.base_stat"
                  :max="255"
                  :get-value-label="(v: number | null | undefined) => `${v} of 255`"
                  class="mt-1"
                />
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-primary">Abilities</h2>
            <ul class="mt-4 list-disc space-y-1 pl-5 text-muted">
              <li v-for="a in pokemon.abilities" :key="a.ability.name">
                {{ humanize(a.ability.name) }}{{ a.is_hidden ? ' (hidden)' : '' }}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import { usePokemonStore } from '@/stores/pokemonStore'
import { typeColorClass } from '@/utils/typeColors'
import { useRoute } from 'vue-router'
import { watch, computed } from 'vue'

const route = useRoute()
const store = usePokemonStore()

watch(
  () => route.params.name as string,
  (name) => store.loadPokemonDetail(name),
  { immediate: true },
)

const humanize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll('-', ' ')

const routeName = computed(() => route.params.name as string)

const pokemon = computed(() => store.detailsByName[routeName.value])

const pageTitle = computed(() => {
  if (store.detailError?.kind === 'not_found') return 'Pokémon not found'
  if (store.detailStatus === 'ready' && pokemon.value) return humanize(pokemon.value.name)
  if (routeName.value) return humanize(routeName.value)
  return 'Pokémon details'
})

const imageUrl = computed(
  () =>
    pokemon.value?.sprites.other?.['official-artwork']?.front_default ??
    pokemon.value?.sprites.front_default ??
    null,
)
</script>
