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
    <UInput
      v-model="query"
      name="q"
      type="search"
      icon="i-lucide-search"
      placeholder="Search articles"
      aria-label="Search articles"
      class="flex-1"
    />
    <UButton
      type="submit"
      label="Search"
      color="neutral"
      variant="outline"
    />
  </form>
</template>
