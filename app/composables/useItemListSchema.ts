interface ListEntry {
  name: string
  url: string
}

export function useItemListSchema(entries: ListEntry[], options: { offset?: number, name?: string } = {}) {
  if (!entries.length) return
  const offset = options.offset ?? 0
  useSchemaOrg([
    defineItemList({
      name: options.name,
      itemListElement: entries.map((entry, index) => ({ position: offset + index + 1, name: entry.name, item: entry.url })),
    }),
  ])
}
