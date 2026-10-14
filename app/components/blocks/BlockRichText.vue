<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ block: BlockProps<'rich_text'> }>()
</script>

<template>
  <section>
    <UContainer class="max-w-3xl py-14 sm:py-20">
      <div
        class="article-body prose max-w-none prose-lg"
        v-html="block.content_html"
      />
    </UContainer>
  </section>
</template>
