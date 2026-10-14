<script setup lang="ts">
import type { MediaPurpose } from '#shared/schemas/media.schema'
import type { MediaAsset } from '#shared/types/models'

const props = withDefaults(defineProps<{
  label: string
  name: string
  help?: string
  purpose?: MediaPurpose
  initial?: MediaAsset | null
}>(), {
  help: undefined,
  purpose: 'content',
  initial: null,
})

const model = defineModel<string | null>({ required: true })
const preview = ref<MediaAsset | null>(props.initial)
const open = ref(false)

watch(() => props.initial, (value) => {
  preview.value = value
})

function choose(media: MediaAsset) {
  model.value = media.id
  preview.value = media
  open.value = false
}

function clear() {
  model.value = null
  preview.value = null
}
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :help="help"
  >
    <div class="flex items-center gap-3">
      <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-default bg-elevated">
        <img
          v-if="model && preview"
          :src="preview.variants[0]?.url ?? preview.url"
          :alt="preview.alt"
          class="size-full object-contain p-1"
        >
        <UIcon
          v-else
          name="i-lucide-image"
          class="size-5 text-dimmed"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <UModal
          v-model:open="open"
          :title="`Choose ${label.toLowerCase()}`"
          :ui="{ content: 'sm:max-w-4xl' }"
        >
          <UButton
            :label="model ? 'Replace' : 'Choose'"
            color="neutral"
            variant="outline"
            size="sm"
          />
          <template #body>
            <MediaLibrary
              :selected-id="model"
              :purpose="purpose"
              :per-page="18"
              @select="choose"
            />
          </template>
        </UModal>
        <UButton
          v-if="model"
          label="Remove"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="clear"
        />
      </div>
    </div>
  </UFormField>
</template>
