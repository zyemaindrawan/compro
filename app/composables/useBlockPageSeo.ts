import type { PublicPage } from '#shared/types/models'

export function useBlockPageSeo(page: Ref<PublicPage | null | undefined>, options: { previewing: boolean, fallbackTitle?: string, fallbackDescription?: string }) {
  const hero = computed(() => page.value?.blocks.find(block => block.type === 'hero')?.props as { subheading?: string } | undefined)

  usePageSeo(() => ({
    title: page.value?.seo.metaTitle || options.fallbackTitle || page.value?.title || '',
    description: page.value?.seo.metaDescription || options.fallbackDescription || hero.value?.subheading,
    image: page.value?.seo.ogImage,
    keywords: page.value?.seo.metaKeywords,
    canonical: page.value?.seo.canonicalUrl || undefined,
    noindex: Boolean(page.value?.seo.noindex) || options.previewing,
  }))
}
