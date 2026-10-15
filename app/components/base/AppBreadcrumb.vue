<script setup lang="ts">
defineProps<{ items: { label: string, to?: string }[] }>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1.5 text-sm">
      <li
        v-for="(item, index) in items"
        :key="item.label"
        class="flex items-center gap-1.5"
      >
        <UIcon
          v-if="index > 0"
          name="i-lucide-chevron-right"
          class="size-4 text-dimmed"
          aria-hidden="true"
        />
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          :class="index === items.length - 1 ? 'font-semibold text-primary' : 'font-medium text-muted transition-colors hover:text-default'"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="font-semibold text-primary"
          aria-current="page"
        >{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
