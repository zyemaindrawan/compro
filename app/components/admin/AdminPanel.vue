<script setup lang="ts">
defineProps<{
  id: string
  title: string
}>()
</script>

<template>
  <UDashboardPanel :id="id">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
