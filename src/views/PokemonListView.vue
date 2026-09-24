<template>
  <main class="mx-auto max-w-5xl px-4 py-12">
    <h1 class="text-3xl font-semibold text-primary">Pokémon Explorer</h1>

    <ul class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <li v-for="p in store.paginatedItems" :key="p.name">
        <PokemonCard :name="p.name" :detail="store.detailsByName[p.name]" />
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
  </main>
</template>

<script setup lang="ts">
import PokemonCard from '@/components/PokemonCard.vue'
import { usePokemonStore } from '@/stores/pokemonStore'
import { onMounted, watch } from 'vue'

const store = usePokemonStore()

onMounted(() => store.bootstrap())

watch(
  () => store.paginatedItems,
  () => store.ensurePageDetails(),
)
</script>
