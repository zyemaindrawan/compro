<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { AdminService } from '#shared/types/models'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'services_grid'>>({ required: true })

const api = useApi()
const { data: services } = useAsyncData('admin-service-options', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })
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
      label="Services"
      :name="`${path}.service_ids`"
      help="Leave empty to show every active service in their saved order."
    >
      <USelectMenu
        v-model="block.service_ids"
        :items="services"
        value-key="id"
        label-key="name"
        multiple
        placeholder="All services"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
