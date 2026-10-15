<script setup lang="ts">
import type { CategorySummary } from '#shared/types/models'

defineProps<{
  categories: CategorySummary[]
  active?: string
}>()
</script>

<template>
  <nav
    aria-label="Categories"
    class="-mx-4 overflow-x-auto px-4"
  >
    <ul class="flex gap-2">
      <li>
        <BaseButton
          to="/articles"
          label="All"
          size="sm"
          :color="active ? 'neutral' : 'primary'"
          :variant="active ? 'outline' : 'solid'"
        />
      </li>
      <li
        v-for="category in categories"
        :key="category.slug"
      >
        <BaseButton
          :to="`/articles/category/${category.slug}`"
          size="sm"
          :color="active === category.slug ? 'primary' : 'neutral'"
          :variant="active === category.slug ? 'solid' : 'outline'"
          class="whitespace-nowrap"
        >
          {{ category.name }}
          <span class="tabular-nums opacity-60">{{ category.articleCount }}</span>
        </BaseButton>
      </li>
    </ul>
  </nav>
</template>
