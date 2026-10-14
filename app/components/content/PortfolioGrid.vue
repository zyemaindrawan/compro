<script setup lang="ts">
import type { PortfolioItem } from '#shared/types/models'

withDefaults(defineProps<{
  items: PortfolioItem[]
  headingLevel?: 'h2' | 'h3'
}>(), {
  headingLevel: 'h3',
})
</script>

<template>
  <ul class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
    <li
      v-for="item in items"
      :key="item.id"
      v-reveal
    >
      <PortfolioCard
        :item="item"
        :heading-level="headingLevel"
      />
    </li>
  </ul>
</template>
