<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <UInput
      v-model="localQuery"
      type="search"
      placeholder="Search Pokémon"
      aria-label="Search Pokémon by name"
      icon="i-lucide-search"
      class="sm:flex-1"
    />

    <USelect
      aria-label="Filter by type"
      :items="[
        { label: 'All types', value: null },
        ...store.types.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t })),
      ]"
      :model-value="store.selectedType"
      class="w-full sm:w-48"
      @update:model-value="store.setType($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemonStore'
import { ref, watch, onUnmounted } from 'vue'

const store = usePokemonStore()

const localQuery = ref(store.searchQuery)

let timer: ReturnType<typeof setTimeout>
watch(localQuery, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => store.setSearch(value), 300)
})

onUnmounted(() => clearTimeout(timer))
</script>
