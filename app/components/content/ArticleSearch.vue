<script setup lang="ts">
const route = useRoute()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')

watch(() => route.query.q, (value) => {
  query.value = typeof value === 'string' ? value : ''
})

function submit() {
  const q = query.value.trim()
  return navigateTo({ path: '/articles', query: q ? { q } : undefined })
}
</script>

<template>
  <form
    role="search"
    action="/articles"
    method="get"
    class="flex w-full gap-2 sm:max-w-sm"
    @submit.prevent="submit"
  >
    <label class="relative flex-1">
      <span class="sr-only">Search articles</span>
      <UIcon
        name="i-lucide-search"
        class="pointer-events-none absolute top-1/2 left-2.5 size-5 -translate-y-1/2 text-dimmed"
      />
      <input
        v-model="query"
        name="q"
        type="search"
        placeholder="Search articles"
        class="w-full rounded-md bg-default py-1.5 ps-9 pe-2.5 text-base/5 text-highlighted md:text-sm ring ring-accented ring-inset placeholder:text-dimmed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
    </label>
    <BaseButton
      type="submit"
      label="Search"
      color="neutral"
      variant="outline"
    />
  </form>
</template>
