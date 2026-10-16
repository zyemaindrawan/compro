<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="max-w-2xl space-y-3">
    <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="text-lg text-pretty text-muted"
    >
      {{ description }}
    </p>
  </div>
</template>
