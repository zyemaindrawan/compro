<script setup lang="ts" generic="T extends { id: string }">
import { useSortable } from '@vueuse/integrations/useSortable'

const props = withDefaults(defineProps<{
  items: T[]
  loading?: boolean
  emptyIcon?: string
  emptyTitle: string
  emptyDescription?: string
}>(), {
  loading: false,
  emptyIcon: 'i-lucide-inbox',
  emptyDescription: undefined,
})

const emit = defineEmits<{ reorder: [ids: string[]] }>()

defineSlots<{
  default: (props: { item: T }) => unknown
  empty?: () => unknown
}>()

const list = useTemplateRef<HTMLElement>('list')
const rows = ref([...props.items]) as Ref<T[]>

watch(() => props.items, (value) => {
  rows.value = [...value]
})

useSortable(list, rows, {
  handle: '[data-drag-handle]',
  animation: 150,
  onUpdate: (event: { oldIndex?: number, newIndex?: number }) => {
    if (event.oldIndex === undefined || event.newIndex === undefined) return
    const next = [...rows.value]
    const [moved] = next.splice(event.oldIndex, 1)
    if (moved) next.splice(event.newIndex, 0, moved)
    rows.value = next
    emit('reorder', next.map(row => row.id))
  },
})
</script>

<template>
  <div>
    <div
      v-if="loading && !rows.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-16"
      />
    </div>
    <EmptyState
      v-else-if="!rows.length"
      :icon="emptyIcon"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <slot name="empty" />
    </EmptyState>
    <ul
      v-show="rows.length"
      ref="list"
      class="divide-y divide-default overflow-hidden rounded-lg border border-default"
    >
      <li
        v-for="item in rows"
        :key="item.id"
        class="flex items-center gap-3 bg-default px-3 py-3"
      >
        <button
          type="button"
          data-drag-handle
          class="cursor-grab touch-none rounded p-1 text-dimmed hover:text-default"
          aria-label="Drag to reorder"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="size-4"
          />
        </button>
        <slot :item="item" />
      </li>
    </ul>
  </div>
</template>
