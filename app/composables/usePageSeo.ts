import type { MediaAsset } from '#shared/types/models'

interface PageSeoInput {
  title: string
  description?: string
  image?: MediaAsset | null
  canonical?: string
  keywords?: string[]
  noindex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  section?: string
}

export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>) {
  const { settings } = useSiteSettings()
  const value = computed(() => toValue(input))
  const image = computed(() => value.value.image ?? settings.value?.defaultOg ?? null)

  useSeoMeta({
    title: () => value.value.title,
    description: () => value.value.description || settings.value?.description,
    ogTitle: () => value.value.title,
    ogDescription: () => value.value.description || settings.value?.description,
    ogType: () => value.value.type ?? 'website',
    ogImage: () => image.value
      ? { url: image.value.url, width: image.value.width ?? undefined, height: image.value.height ?? undefined, alt: image.value.alt }
      : undefined,
    robots: () => (value.value.noindex ? 'noindex, follow' : undefined),
    articlePublishedTime: () => value.value.publishedTime ?? undefined,
    articleModifiedTime: () => value.value.modifiedTime ?? undefined,
    articleSection: () => value.value.section,
  })

  useHead({
    link: () => value.value.canonical ? [{ rel: 'canonical', href: value.value.canonical, key: 'canonical' }] : [],
    meta: () => value.value.keywords?.length ? [{ name: 'keywords', content: value.value.keywords.join(', ') }] : [],
  })
}
