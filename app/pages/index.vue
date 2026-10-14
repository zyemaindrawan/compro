<script setup lang="ts">
const { page, previewing } = await usePublicPage('/api/public/home', 'home-page')
const { settings } = useSiteSettings()

useBlockPageSeo(page, {
  previewing: previewing.value,
  fallbackTitle: settings.value?.tagline || 'Home',
  fallbackDescription: settings.value?.description,
})
</script>

<template>
  <div v-if="page">
    <PreviewBanner v-if="previewing" />
    <BlockRenderer
      :blocks="page.blocks"
      :data="page.data"
    />
  </div>
</template>
