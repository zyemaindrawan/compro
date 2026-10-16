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
    <AppContainer
      v-if="page.blocks[0]?.type !== 'hero'"
      width="3xl"
      class="pt-14 sm:pt-20"
    >
      <PageHeading :title="page.title" />
    </AppContainer>
    <BlockRenderer
      :blocks="page.blocks"
      :data="page.data"
    />
  </div>
</template>
