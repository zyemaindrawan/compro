<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ block: BlockProps<'stats'> }>()
</script>

<template>
  <section class="border-y border-default">
    <UContainer class="space-y-10 py-16 sm:py-20">
      <h2
        v-if="block.heading"
        class="text-sm font-medium text-muted"
      >
        {{ block.heading }}
      </h2>
      <dl class="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
        <div
          v-for="item in block.items"
          :key="item.label"
          v-reveal
          class="flex flex-col-reverse gap-2"
        >
          <dt class="text-sm text-muted">
            {{ item.label }}
          </dt>
          <dd class="font-display text-4xl font-bold text-highlighted tabular-nums sm:text-5xl">
            {{ item.value }}
          </dd>
        </div>
      </dl>
    </UContainer>
  </section>
</template>
