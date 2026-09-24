<template>
  <main class="mx-auto max-w-5xl px-4 py-12">
    <h1 class="text-3xl font-semibold text-primary">Pokémon Explorer</h1>

    <AppErrorState
      v-if="store.bootstrapStatus === 'error' && store.error"
      class="mt-6"
      :error="store.error"
      variant="blocking"
      @retry="store.bootstrap()"
    />

    <template v-else>
      <PokemonFilters class="mt-6" />

      <AppErrorState
        v-if="store.pageDetailsStatus === 'error' && store.error"
        class="mt-6"
        :error="store.error"
        variant="inline"
        @retry="store.ensurePageDetails()"
      />

      <p
        v-if="store.bootstrapStatus === 'ready' && !store.filteredPokemon.length"
        class="mt-8 text-center text-muted"
      >
        There are no Pokémon that match your search.
      </p>

      <template v-else>
        <ul class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <li v-for="p in store.paginatedItems" :key="p.name">
            <PokemonCard
              :name="p.name"
              :detail="store.detailsByName[p.name]"
              :failed-thumbnail="store.pageDetailsStatus === 'error'"
            />
          </li>
        </ul>

        <nav aria-label="Pokémon pages" class="mt-8 flex justify-center">
          <UPagination
            variant="soft"
            :page="store.currentPage"
            :total="store.filteredPokemon.length"
            :items-per-page="store.pageSize"
            @update:page="store.setPage"
            :ui="{ list: 'cursor-pointer' }"
          />
        </nav>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import AppErrorState from '@/components/AppErrorState.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import PokemonFilters from '@/components/PokemonFilters.vue'
import { usePokemonStore } from '@/stores/pokemonStore'
import { onMounted, watch } from 'vue'

const store = usePokemonStore()

onMounted(() => store.bootstrap())

watch(
  () => store.paginatedItems,
  () => store.ensurePageDetails(),
)

watch(
  () => store.selectedType,
  (t) => {
    if (t) store.loadTypePokemon(t)
  },
)
</script>
