<script setup lang="ts">
import type { ArticleSummary } from '#shared/types/models'

withDefaults(defineProps<{
  articles: ArticleSummary[]
  featureFirst?: boolean
  headingLevel?: 'h2' | 'h3'
}>(), {
  featureFirst: false,
  headingLevel: 'h3',
})
</script>

<template>
  <div class="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
    <ArticleCard
      v-for="(article, index) in articles"
      :key="article.id"
      v-reveal
      :article="article"
      :featured="featureFirst && index === 0"
      :priority="index === 0"
      :heading-level="headingLevel"
      :class="{ 'sm:col-span-2 lg:col-span-3': featureFirst && index === 0 }"
    />
  </div>
</template>
