<script setup lang="ts">
const props = defineProps<{
  page: number
  total: number
  perPage: number
}>()

const route = useRoute()

function to(page: number) {
  return { path: route.path, query: { ...route.query, page: page > 1 ? page : undefined } }
}
</script>

<template>
  <nav
    v-if="props.total > props.perPage"
    aria-label="Pagination"
    class="flex justify-center"
  >
    <UPagination
      :page="page"
      :total="total"
      :items-per-page="perPage"
      :to="to"
      show-edges
      :sibling-count="1"
    />
  </nav>
</template>
