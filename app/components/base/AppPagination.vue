<script setup lang="ts">
const props = defineProps<{
  page: number
  total: number
  perPage: number
}>()

const route = useRoute()
const pageCount = computed(() => Math.ceil(props.total / props.perPage))

const items = computed(() => {
  const pages = new Set([1, pageCount.value, props.page - 1, props.page, props.page + 1])
  const sorted = [...pages].filter(page => page >= 1 && page <= pageCount.value).sort((a, b) => a - b)
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1]
    return previous !== undefined && page - previous > 1 ? [null, page] : [page]
  })
})

function to(page: number) {
  return { path: route.path, query: { ...route.query, page: page > 1 ? String(page) : undefined } }
}

const linkClass = 'inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors'
</script>

<template>
  <nav
    v-if="pageCount > 1"
    aria-label="Pagination"
    class="flex justify-center"
  >
    <ul class="flex items-center gap-1">
      <li>
        <NuxtLink
          v-if="page > 1"
          :to="to(page - 1)"
          rel="prev"
          aria-label="Previous page"
          :class="[linkClass, 'text-default hover:bg-elevated']"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-5"
          />
        </NuxtLink>
      </li>
      <li
        v-for="(item, index) in items"
        :key="item ?? `gap-${index}`"
      >
        <span
          v-if="item === null"
          :class="[linkClass, 'text-muted']"
          aria-hidden="true"
        >…</span>
        <NuxtLink
          v-else
          :to="to(item)"
          :aria-label="`Page ${item}`"
          :aria-current="item === page ? 'page' : undefined"
          :class="[linkClass, item === page ? 'bg-primary text-inverted' : 'text-default ring ring-accented ring-inset hover:bg-elevated']"
        >
          {{ item }}
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          v-if="page < pageCount"
          :to="to(page + 1)"
          rel="next"
          aria-label="Next page"
          :class="[linkClass, 'text-default hover:bg-elevated']"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
