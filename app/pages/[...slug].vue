<script setup lang="ts">
const route = useRoute('slug')
const slug = computed(() => (Array.isArray(route.params.slug) ? route.params.slug.join('/') : String(route.params.slug ?? '')))

const { page, previewing } = await usePublicPage(() => `/api/public/pages/${slug.value}`, () => `page-${slug.value}`)

useBlockPageSeo(page, { previewing: previewing.value })
useSchemaOrg([
  defineBreadcrumb({ itemListElement: [{ name: page.value?.title ?? '', item: `/${slug.value}` }] }),
])
</script>

<template>
  <div v-if="page">
    <PreviewBanner v-if="previewing" />
    <UContainer
      v-if="page.blocks[0]?.type !== 'hero'"
      class="max-w-3xl pt-14 sm:pt-20"
    >
      <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
        {{ page.title }}
      </h1>
    </UContainer>
    <BlockRenderer
      :blocks="page.blocks"
      :data="page.data"
    />
  </div>
</template>
