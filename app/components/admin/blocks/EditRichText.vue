<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'rich_text'>>({ required: true })
</script>

<template>
  <UFormField :name="`${path}.content_html`">
    <RichEditor
      v-model:json="block.content_json"
      v-model:html="block.content_html"
    />
  </UFormField>
</template>
