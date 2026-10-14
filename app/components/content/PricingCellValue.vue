<script setup lang="ts">
import type { PricingCell } from '#shared/types/models'

defineProps<{ cell?: PricingCell }>()
</script>

<template>
  <span
    v-if="cell?.type === 'check'"
    class="inline-flex text-primary"
  >
    <UIcon
      name="i-lucide-check"
      class="size-5"
    />
    <span class="sr-only">Included</span>
  </span>
  <span
    v-else-if="cell?.type === 'text'"
    class="text-highlighted"
  >{{ cell.text }}</span>
  <span
    v-else
    class="inline-flex text-dimmed"
  >
    <UIcon
      name="i-lucide-minus"
      class="size-5"
    />
    <span class="sr-only">Not included</span>
  </span>
</template>
