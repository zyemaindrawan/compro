<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { MediaAsset } from '#shared/types/models'

defineProps<{ path: string, media: Record<string, MediaAsset> }>()
const block = defineModel<BlockProps<'hero'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Eyebrow"
      :name="`${path}.eyebrow`"
      help="Short label above the headline."
    >
      <UInput
        v-model="block.eyebrow"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Headline"
      :name="`${path}.heading`"
      required
    >
      <UTextarea
        v-model="block.heading"
        :rows="2"
        autoresize
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Intro"
      :name="`${path}.subheading`"
    >
      <UTextarea
        v-model="block.subheading"
        :rows="2"
        autoresize
        class="w-full"
      />
    </UFormField>
    <LinkFields
      v-model="block.primary"
      label="Primary button"
      :path="`${path}.primary`"
    />
    <LinkFields
      v-model="block.secondary"
      label="Secondary button"
      :path="`${path}.secondary`"
    />
    <MediaField
      v-model="block.media_id"
      :name="`${path}.media_id`"
      label="Image"
      help="Optional. Shown beside the text on large screens."
      :initial="block.media_id ? media[block.media_id] : null"
    />
  </div>
</template>
