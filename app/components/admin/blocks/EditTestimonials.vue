<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'testimonials'>>({ required: true })

const limits = [1, 2, 3, 4, 5, 6].map(value => ({ label: String(value), value: String(value) }))
const limit = computed({
  get: () => String(block.value.limit),
  set: (value: string) => {
    block.value.limit = Number(value)
  },
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <UFormField
        label="Heading"
        :name="`${path}.heading`"
      >
        <UInput
          v-model="block.heading"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Number shown"
        :name="`${path}.limit`"
      >
        <USelect
          v-model="limit"
          :items="limits"
          class="w-full"
        />
      </UFormField>
    </div>
    <p class="text-xs text-muted">
      Testimonials come from <ULink
        to="/admin/testimonials"
        class="text-primary"
      >Testimonials</ULink>. The first one is shown large.
    </p>
  </div>
</template>
