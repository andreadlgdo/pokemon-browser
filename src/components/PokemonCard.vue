<template>
  <RouterLink
    :to="`/pokemon/${name}`"
    class="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <UCard
    variant="outline"
      class="h-full  group-hover:ring-primary-200! group-hover:ring-2 transition-all duration-300"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="flex size-50 items-center justify-center">
          <USkeleton v-if="detail === undefined" class="size-50" />
          <img
            v-else-if="imageUrl"
            :src="imageUrl"
            :alt="`Artwork of ${name}`"
            width="200"
            height="200"
            loading="lazy"
            class="size-50 object-contain"
          />
          <div v-else class="flex size-50 items-center justify-center text-sm text-muted">
            No artwork
          </div>
        </div>

        <h2 class="capitalize">{{ name }}</h2>

        <div v-if="detail?.types.length" class="flex flex-wrap justify-center gap-1">
          <UBadge v-for="t in detail.types" :key="t.type.name" variant="subtle" class="capitalize">
            {{ t.type.name }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </RouterLink>
</template>

<script setup lang="ts">
import type { PokemonDetail } from '@/types/pokemon'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  detail?: PokemonDetail
}>()

const imageUrl = computed(
  () =>
    props.detail?.sprites.other?.['official-artwork']?.front_default ??
    props.detail?.sprites.front_default ??
    null,
)
</script>
