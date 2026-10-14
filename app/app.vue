<script setup lang="ts">
const route = useRoute()
await useLayoutData()
const { settings } = useSiteSettings()

const isAdmin = computed(() => route.path.startsWith('/admin'))

useHead({
  titleTemplate: (title?: string) => {
    const siteName = settings.value?.siteName ?? ''
    if (!title) return siteName
    return (settings.value?.titleTemplate ?? '%s').replace('%s', title)
  },
  link: () => settings.value?.favicon
    ? [{ rel: 'icon', type: settings.value.favicon.mime, href: settings.value.favicon.url }]
    : [],
  script: () => settings.value?.umamiWebsiteId && !isAdmin.value
    ? [{ 'src': settings.value.umamiScriptUrl, 'defer': true, 'data-website-id': settings.value.umamiWebsiteId }]
    : [],
})

useHead({
  link: [{ rel: 'preconnect', href: useRuntimeConfig().public.mediaOrigin }],
})

useSchemaOrg([
  defineOrganization({
    name: settings.value?.siteName ?? '',
    sameAs: settings.value?.socialLinks.map(link => link.url) ?? [],
    ...(settings.value?.logoLight ? { logo: settings.value.logoLight.url } : {}),
  }),
  defineWebSite({
    name: settings.value?.siteName ?? '',
    potentialAction: [defineSearchAction({ target: '/articles?q={search_term_string}' })],
  }),
  defineWebPage(),
])

useSeoMeta({
  description: () => settings.value?.description,
  ogSiteName: () => settings.value?.siteName,
  ogType: 'website',
  ogImage: () => settings.value?.defaultOg
    ? {
        url: settings.value.defaultOg.url,
        width: settings.value.defaultOg.width ?? undefined,
        height: settings.value.defaultOg.height ?? undefined,
        alt: settings.value.defaultOg.alt,
      }
    : undefined,
})
</script>

<template>
  <UApp
    :toaster="{ position: 'bottom-right' }"
    :tooltip="{ delayDuration: 300 }"
  >
    <NuxtLoadingIndicator
      color="var(--ui-primary)"
      :height="2"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
