<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { MediaAsset } from '#shared/types/models'

defineProps<{ path: string, media: Record<string, MediaAsset> }>()
const block = defineModel<BlockProps<'image_text'>>({ required: true })

const sides = [
  { label: 'Image left', value: 'left' },
  { label: 'Image right', value: 'right' },
]
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Heading"
      :name="`${path}.heading`"
      required
    >
      <UInput
        v-model="block.heading"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Text"
      :name="`${path}.body`"
      help="Leave an empty line between paragraphs."
    >
      <UTextarea
        v-model="block.body"
        :rows="5"
        autoresize
        class="w-full"
      />
    </UFormField>
    <MediaField
      v-model="block.media_id"
      :name="`${path}.media_id`"
      label="Image"
      :initial="block.media_id ? media[block.media_id] : null"
    />
    <URadioGroup
      v-model="block.image_side"
      :items="sides"
      orientation="horizontal"
      legend="Layout"
    />
    <LinkFields
      v-model="block.cta"
      label="Link"
      :path="`${path}.cta`"
    />
  </div>
</template>
