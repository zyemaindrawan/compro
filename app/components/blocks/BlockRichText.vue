<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ block: BlockProps<'rich_text'> }>()
</script>

<template>
  <section>
    <AppContainer
      width="3xl"
      class="py-14 sm:py-20"
    >
      <div
        class="article-body prose max-w-none prose-lg"
        v-html="block.content_html"
      />
    </AppContainer>
  </section>
</template>
