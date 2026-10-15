<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { AdminFaq } from '#shared/types/models'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'faq'>>({ required: true })

const api = useApi()
const { data: faqs } = useAsyncData('admin-faqs', () => api<AdminFaq[]>('/api/admin/faqs'), { default: () => [] })
const ALL = 'all'
const options = computed(() => [
  { label: 'All questions', value: ALL },
  ...[...new Set(faqs.value.map(faq => faq.group).filter(Boolean))].map(group => ({ label: group, value: group })),
])

const group = computed({
  get: () => block.value.group || ALL,
  set: (value: string) => {
    block.value.group = value === ALL ? '' : value
  },
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Heading"
        :name="`${path}.heading`"
      >
        <UInput
          v-model="block.heading"
          placeholder="Frequently asked questions"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Group"
        :name="`${path}.group`"
      >
        <USelect
          v-model="group"
          :items="options"
          class="w-full"
        />
      </UFormField>
    </div>
    <p class="text-xs text-muted">
      Questions come from <ULink
        to="/admin/faqs"
        class="text-primary"
      >FAQs</ULink>.
    </p>
  </div>
</template>
