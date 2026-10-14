<script setup lang="ts">
import type { PricingCellInput } from '#shared/schemas/page.schema'

defineProps<{ label: string }>()
const cell = defineModel<PricingCellInput>('cell', { required: true })

const ORDER: PricingCellInput['value_type'][] = ['check', 'cross', 'text']
const ICONS = { check: 'i-lucide-check', cross: 'i-lucide-minus', text: 'i-lucide-type' } as const
const NAMES = { check: 'included', cross: 'not included', text: 'custom text' } as const

function cycle() {
  cell.value.value_type = ORDER[(ORDER.indexOf(cell.value.value_type) + 1) % ORDER.length] ?? 'check'
}
</script>

<template>
  <div class="flex items-center gap-1">
    <UButton
      :icon="ICONS[cell.value_type]"
      :color="cell.value_type === 'check' ? 'primary' : 'neutral'"
      variant="soft"
      size="sm"
      :aria-label="`${label}: ${NAMES[cell.value_type]}. Click to change.`"
      @click="cycle"
    />
    <UInput
      v-if="cell.value_type === 'text'"
      v-model="cell.value_text"
      size="sm"
      placeholder="e.g. 30 days"
      aria-label="Text"
      class="w-28"
    />
  </div>
</template>
