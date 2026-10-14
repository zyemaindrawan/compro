import type { Ref } from 'vue'

interface CollectionOptions<TItem, TInput> {
  key: string
  endpoint: string
  noun: string
  blank: () => TInput
  toInput: (item: TItem) => TInput
}

export function useCollectionAdmin<TItem extends { id: string }, TInput extends { is_active: boolean }>(options: CollectionOptions<TItem, TInput>) {
  const api = useApi()
  const notify = useNotify()
  const { data: items, status } = useAsyncData(options.key, () => api<TItem[]>(options.endpoint), { default: () => [] as TItem[] })

  const editing = ref<TItem | null>(null) as Ref<TItem | null>
  const deleting = ref<TItem | null>(null) as Ref<TItem | null>
  const state = ref(options.blank()) as Ref<TInput>
  const formOpen = ref(false)
  const saving = ref(false)
  const capitalized = options.noun.charAt(0).toUpperCase() + options.noun.slice(1)

  function openCreate() {
    editing.value = null
    state.value = options.blank()
    formOpen.value = true
  }

  function openEdit(item: TItem) {
    editing.value = item
    state.value = options.toInput(item)
    formOpen.value = true
  }

  async function save(data: TInput, onFieldErrors: (errors: FormError[]) => void) {
    saving.value = true
    try {
      items.value = await api<TItem[]>(editing.value ? `${options.endpoint}/${editing.value.id}` : options.endpoint, {
        method: editing.value ? 'PUT' : 'POST',
        body: data,
      })
      notify.success(editing.value ? `${capitalized} updated` : `${capitalized} added`)
      formOpen.value = false
    }
    catch (error) {
      onFieldErrors(apiFieldErrors(error))
      notify.error(error, `${capitalized} not saved`)
    }
    finally {
      saving.value = false
    }
  }

  async function toggleActive(item: TItem) {
    const input = options.toInput(item)
    try {
      items.value = await api<TItem[]>(`${options.endpoint}/${item.id}`, { method: 'PUT', body: { ...input, is_active: !input.is_active } })
    }
    catch (error) {
      notify.error(error)
    }
  }

  async function reorder(ids: string[]) {
    try {
      items.value = await api<TItem[]>(`${options.endpoint}/order`, { method: 'PUT', body: { ids } })
      notify.success('Order saved')
    }
    catch (error) {
      notify.error(error, 'Order not saved')
    }
  }

  async function remove() {
    const target = deleting.value
    if (!target) return
    try {
      items.value = await api<TItem[]>(`${options.endpoint}/${target.id}`, { method: 'DELETE' })
      notify.success(`${capitalized} deleted`)
      deleting.value = null
    }
    catch (error) {
      notify.error(error)
    }
  }

  return {
    items,
    status,
    editing,
    deleting,
    state,
    formOpen,
    saving,
    openCreate,
    openEdit,
    save,
    toggleActive,
    reorder,
    remove,
  }
}
