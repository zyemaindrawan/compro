export function useFormat() {
  const { timezone } = useSiteSettings()
  return {
    date: (value: string | null | undefined) => formatDate(value, timezone.value),
    dateTime: (value: string | null | undefined) => formatDateTime(value, timezone.value),
    currency: formatCurrency,
    number: formatNumber,
    bytes: formatBytes,
  }
}
