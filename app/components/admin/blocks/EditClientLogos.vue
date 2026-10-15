<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'client_logos'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Heading"
      :name="`${path}.heading`"
      help="Short line above the logos."
    >
      <UInput
        v-model="block.heading"
        class="w-full"
      />
    </UFormField>
    <p class="text-xs text-muted">
      Logos come from <ULink
        to="/admin/clients"
        class="text-primary"
      >Clients</ULink>. Scrolling speed is under <ULink
        to="/admin/settings"
        class="text-primary"
      >Settings</ULink>.
    </p>
  </div>
</template>
