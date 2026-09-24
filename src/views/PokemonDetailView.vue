<template>
  <main class="mx-auto max-w-5xl px-4 py-12">
    <RouterLink to="/" class="text-sm text-muted hover:text-primary">Back to list</RouterLink>

    <template v-if="store.detailStatus === 'loading' || store.detailStatus === 'idle'">
      <div class="mt-6 flex flex-col items-center gap-4">
        <USkeleton class="size-50" />
        <USkeleton class="h-8 w-48" />
        <p class="text-muted">Loading…</p>
      </div>
    </template>

    <template v-else-if="store.detailStatus === 'error' && store.detailError">
      <p v-if="store.detailError.kind === 'not_found'" class="mt-6 text-muted">
        Pokémon not found
      </p>

      <AppErrorState
        v-else
        class="mt-6"
        :error="store.detailError"
        variant="blocking"
        @retry="store.loadPokemonDetail(route.params.name as string)"
      />
    </template>

    <template v-else-if="store.detailStatus === 'ready' && pokemon">
      <div class="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
        <div class="flex size-50 shrink-0 items-center justify-center">
          <img
            v-if="
              pokemon.sprites.other?.['official-artwork']?.front_default ??
              pokemon.sprites.front_default
            "
            :src="
              (pokemon.sprites.other?.['official-artwork']?.front_default ??
                pokemon.sprites.front_default)!
            "
            :alt="`Artwork of ${pokemon.name}`"
            width="200"
            height="200"
            loading="lazy"
            class="size-50 object-contain"
          />
          <div v-else class="flex size-50 items-center justify-center text-sm text-muted">
            No artwork
          </div>
        </div>

        <div class="flex flex-col items-center gap-3 sm:items-start">
          <h1 class="text-3xl font-semibold capitalize text-primary">{{ pokemon.name }}</h1>

          <div v-if="pokemon.types.length" class="flex flex-wrap gap-1">
            <UBadge
              v-for="t in pokemon.types"
              :key="t.type.name"
              variant="subtle"
              class="capitalize"
            >
              {{ t.type.name }}
            </UBadge>
          </div>
        </div>
      </div>

      <section class="mt-8">
        <h2 class="text-lg font-semibold text-primary">Stats</h2>
        <ul class="mt-4 space-y-3">
          <li v-for="s in pokemon.stats" :key="s.stat.name">
            <span class="text-sm text-muted">
              {{ humanize(s.stat.name) }}
            </span>
            <UProgress
              :model-value="s.base_stat"
              :max="255"
              :get-value-label="(v: number | null | undefined) => `${v} of 255`"
              class="mt-1"
            />
          </li>
        </ul>
      </section>

      <section class="mt-8">
        <h2 class="text-lg font-semibold text-primary">Abilities</h2>
        <ul class="mt-4 list-disc space-y-1 pl-5 text-muted">
          <li v-for="a in pokemon.abilities" :key="a.ability.name">
            {{ humanize(a.ability.name) }}{{ a.is_hidden ? ' (hidden)' : '' }}
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import { usePokemonStore } from '@/stores/pokemonStore'
import { useRoute } from 'vue-router'
import { watch, computed } from 'vue'

const route = useRoute()
const store = usePokemonStore()

watch(
  () => route.params.name as string,
  (name) => store.loadPokemonDetail(name),
  { immediate: true },
)

const pokemon = computed(() => store.detailsByName[route.params.name as string])

const humanize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll('-', ' ')
</script>
