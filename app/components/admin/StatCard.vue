<script setup lang="ts">
defineProps<{
  label: string
  value: number
  icon: string
  to?: string
}>()

const { number } = useFormat()
</script>

<template>
  <UPageCard
    :to="to"
    variant="subtle"
    :ui="{ container: 'gap-y-1.5' }"
  >
    <div class="flex items-center justify-between">
      <span class="text-sm text-muted">{{ label }}</span>
      <UIcon
        :name="icon"
        class="size-4 text-dimmed"
      />
    </div>
    <span class="font-display text-3xl font-semibold text-highlighted tabular-nums">{{ number(value) }}</span>
  </UPageCard>
</template>
