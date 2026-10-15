<script setup lang="ts">
defineProps<{
  heading?: string
  intro?: string
  id?: string
}>()
</script>

<template>
  <div
    v-if="heading || intro || $slots.actions"
    class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div class="max-w-2xl space-y-3">
      <h2
        v-if="heading"
        :id="id"
        class="font-display text-3xl font-bold text-balance text-highlighted sm:text-4xl"
      >
        {{ heading }}
      </h2>
      <p
        v-if="intro"
        class="text-lg text-pretty text-muted"
      >
        {{ intro }}
      </p>
    </div>
    <slot name="actions" />
  </div>
</template>
