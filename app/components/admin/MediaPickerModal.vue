<script setup lang="ts">
import type { MediaPurpose } from '#shared/schemas/media.schema'
import type { MediaAsset } from '#shared/types/models'

withDefaults(defineProps<{
  title?: string
  selectedId?: string | null
  purpose?: MediaPurpose
}>(), {
  title: 'Choose an image',
  selectedId: null,
  purpose: 'content',
})
const emit = defineEmits<{ select: [media: MediaAsset] }>()
const open = defineModel<boolean>('open', { required: true })

function choose(media: MediaAsset) {
  emit('select', media)
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <template #body>
      <MediaLibrary
        :selected-id="selectedId"
        :purpose="purpose"
        :per-page="18"
        @select="choose"
      />
    </template>
  </UModal>
</template>
