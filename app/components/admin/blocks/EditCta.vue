<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'cta'>>({ required: true })
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
    >
      <UTextarea
        v-model="block.body"
        :rows="2"
        autoresize
        class="w-full"
      />
    </UFormField>
    <LinkFields
      v-model="block.primary"
      label="Button"
      :path="`${path}.primary`"
    />
  </div>
</template>
