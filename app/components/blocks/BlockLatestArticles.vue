<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'latest_articles'>, data: BlockData }>()

const articles = computed(() => props.data.articles[`${props.block.category_slug || 'all'}:${props.block.limit}`] ?? [])
const moreLink = computed(() => (props.block.category_slug ? `/articles/category/${props.block.category_slug}` : '/articles'))
</script>

<template>
  <section v-if="articles.length">
    <UContainer class="space-y-10 py-16 sm:py-24">
      <SectionHeader :heading="block.heading">
        <template #actions>
          <UButton
            :to="moreLink"
            label="All articles"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="link"
            class="px-0"
          />
        </template>
      </SectionHeader>
      <ArticleGrid :articles="articles" />
    </UContainer>
  </section>
</template>
