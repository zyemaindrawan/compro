import type { PublicPage } from '#shared/types/models'

export async function usePublicPage(publicPath: MaybeRefOrGetter<string>, key: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const previewId = computed(() => (typeof route.query.preview === 'string' ? route.query.preview : null))

  const { data, error } = await useFetch<PublicPage>(
    () => (previewId.value ? `/api/admin/pages/${previewId.value}/preview` : toValue(publicPath)),
    { key: computed(() => (previewId.value ? `page-preview-${previewId.value}` : toValue(key))) },
  )

  if (error.value || !data.value) {
    throw pageError(error.value, 'Page not found')
  }

  return { page: data, previewing: computed(() => Boolean(previewId.value)) }
}
