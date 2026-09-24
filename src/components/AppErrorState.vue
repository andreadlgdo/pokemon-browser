<template>
  <UAlert
    role="alert"
    :color="variant === 'blocking' ? 'error' : 'warning'"
    :variant="variant === 'blocking' ? 'solid' : 'subtle'"
    :title="error.message"
  >
    <template v-if="error.retryable" #actions>
      <UButton label="Try again" color="neutral" variant="solid" @click="emit('retry')" />
    </template>
  </UAlert>
</template>

<script setup lang="ts">
import type { AppError } from '@/types/error'

withDefaults(defineProps<{ error: AppError; variant?: 'blocking' | 'inline' }>(), {
  variant: 'inline',
})

const emit = defineEmits<{ retry: [] }>()
</script>
