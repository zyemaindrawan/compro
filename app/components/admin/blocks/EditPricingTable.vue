<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { AdminService } from '#shared/types/models'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'pricing_table'>>({ required: true })

const api = useApi()
const { data: services } = useAsyncData('admin-service-options', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })
const options = computed(() => [{ label: 'All services (tabs)', value: 'all' }, ...services.value.map(service => ({ label: service.name, value: service.id }))])

const selected = computed({
  get: () => block.value.service_id ?? 'all',
  set: (value: string) => {
    block.value.service_id = value === 'all' ? null : value
  },
})
</script>

<template>
  <div class="space-y-4">
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
      label="Intro"
      :name="`${path}.intro`"
    >
      <UTextarea
        v-model="block.intro"
        :rows="2"
        autoresize
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Plans from"
      :name="`${path}.service_id`"
      help="Edit plans under Pricing in the sidebar."
    >
      <USelect
        v-model="selected"
        :items="options"
        class="w-full sm:w-72"
      />
    </UFormField>
  </div>
</template>
