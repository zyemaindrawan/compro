import type { PublicLayoutData } from '#shared/types/models'

export const LAYOUT_KEY = 'layout'

export function useLayoutData() {
  return useFetch<PublicLayoutData>('/api/public/layout', {
    key: LAYOUT_KEY,
    dedupe: 'defer',
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })
}

export function useSiteSettings() {
  const { data } = useNuxtData<PublicLayoutData>(LAYOUT_KEY)
  const settings = computed(() => data.value?.settings ?? null)
  const services = computed(() => data.value?.services ?? [])
  const timezone = computed(() => settings.value?.timezone)
  return { settings, services, timezone }
}
