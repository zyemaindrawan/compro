<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { AdminService } from '#shared/types/models'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'portfolio_grid'>>({ required: true })

const api = useApi()
const { data: services } = useAsyncData('admin-service-options', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })
const options = computed(() => [{ label: 'All services', value: 'all' }, ...services.value.map(service => ({ label: service.name, value: service.id }))])
const limits = [3, 6, 9, 12].map(value => ({ label: String(value), value: String(value) }))

const service = computed({
  get: () => block.value.service_id ?? 'all',
  set: (value: string) => {
    block.value.service_id = value === 'all' ? null : value
  },
})
const limit = computed({
  get: () => String(block.value.limit),
  set: (value: string) => {
    block.value.limit = Number(value)
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
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Service"
        :name="`${path}.service_id`"
      >
        <USelect
          v-model="service"
          :items="options"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Number of projects"
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
      Projects come from <ULink
        to="/admin/portfolio"
        class="text-primary"
      >Portfolio</ULink>, in the order set there.
    </p>
  </div>
</template>
