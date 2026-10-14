<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { BlockInput, BlockProps, BlockType } from '#shared/schemas/block.schema'
import type { MediaAsset } from '#shared/types/models'

defineProps<{ media: Record<string, MediaAsset> }>()
const blocks = defineModel<(BlockInput & { key: string })[]>({ required: true })

const list = useTemplateRef<HTMLElement>('list')
const openKey = ref<string | null>(blocks.value[0]?.key ?? null)
const confirmRemove = ref<number | null>(null)

useSortable(list, blocks, { handle: '[data-drag-handle]', animation: 150 })

function add(type: BlockType) {
  const definition = blockDefinition(type)
  if (!definition) return
  const block = { key: crypto.randomUUID(), type, is_visible: true, props: definition.create() } as BlockInput & { key: string }
  blocks.value = [...blocks.value, block]
  openKey.value = block.key
}

function move(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= blocks.value.length) return
  const next = [...blocks.value]
  const [item] = next.splice(index, 1)
  if (item) next.splice(target, 0, item)
  blocks.value = next
}

function duplicate(index: number) {
  const source = blocks.value[index]
  if (!source) return
  const copy = { ...structuredClone(toRaw(source)), id: undefined, key: crypto.randomUUID() }
  const next = [...blocks.value]
  next.splice(index + 1, 0, copy)
  blocks.value = next
  openKey.value = copy.key
}

function remove(index: number) {
  blocks.value = blocks.value.filter((_, i) => i !== index)
  confirmRemove.value = null
}

function toggle(key: string) {
  openKey.value = openKey.value === key ? null : key
}

const addItems = computed(() => [BLOCK_DEFINITIONS.map(definition => ({
  label: definition.label,
  description: definition.description,
  icon: definition.icon,
  onSelect: () => add(definition.type),
}))])

function propsOf<T extends BlockType>(block: BlockInput, _type: T) {
  return block.props as BlockProps<T>
}
</script>

<template>
  <div class="space-y-3">
    <EmptyState
      v-if="!blocks.length"
      icon="i-lucide-layout-template"
      title="This page has no blocks yet"
      description="Add a hero first, then the sections that follow."
    />

    <ol
      ref="list"
      class="space-y-3"
    >
      <li
        v-for="(block, index) in blocks"
        :key="block.key"
        class="overflow-hidden rounded-lg border bg-default"
        :class="openKey === block.key ? 'border-accented' : 'border-default'"
      >
        <div class="flex items-center gap-2 px-2 py-2 sm:px-3">
          <button
            type="button"
            data-drag-handle
            class="cursor-grab touch-none rounded p-1 text-dimmed hover:text-default active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <UIcon
              name="i-lucide-grip-vertical"
              class="size-4"
            />
          </button>
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            :aria-expanded="openKey === block.key"
            @click="toggle(block.key)"
          >
            <UIcon
              :name="blockDefinition(block.type)?.icon ?? 'i-lucide-square'"
              class="size-4 shrink-0 text-muted"
            />
            <span class="shrink-0 text-sm font-medium text-highlighted">{{ blockDefinition(block.type)?.label ?? block.type }}</span>
            <span
              class="truncate text-sm text-muted"
              :class="{ 'line-through': !block.is_visible }"
            >{{ blockSummary(block) }}</span>
          </button>
          <UBadge
            v-if="!block.is_visible"
            label="Hidden"
            color="neutral"
            variant="subtle"
            size="sm"
            class="hidden sm:inline-flex"
          />
          <UDropdownMenu
            :items="[
              [
                { label: block.is_visible ? 'Hide' : 'Show', icon: block.is_visible ? 'i-lucide-eye-off' : 'i-lucide-eye', onSelect: () => { block.is_visible = !block.is_visible } },
                { label: 'Move up', icon: 'i-lucide-arrow-up', disabled: index === 0, onSelect: () => move(index, -1) },
                { label: 'Move down', icon: 'i-lucide-arrow-down', disabled: index === blocks.length - 1, onSelect: () => move(index, 1) },
                { label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => duplicate(index) },
              ],
              [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { confirmRemove = index } }],
            ]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="`Actions for block ${index + 1}`"
            />
          </UDropdownMenu>
        </div>

        <div
          v-if="openKey === block.key"
          class="border-t border-default p-4 sm:p-5"
        >
          <EditHero
            v-if="block.type === 'hero'"
            :model-value="propsOf(block, 'hero')"
            :path="`blocks.${index}.props`"
            :media="media"
          />
          <EditRichText
            v-else-if="block.type === 'rich_text'"
            :model-value="propsOf(block, 'rich_text')"
            :path="`blocks.${index}.props`"
          />
          <EditImageText
            v-else-if="block.type === 'image_text'"
            :model-value="propsOf(block, 'image_text')"
            :path="`blocks.${index}.props`"
            :media="media"
          />
          <EditServicesGrid
            v-else-if="block.type === 'services_grid'"
            :model-value="propsOf(block, 'services_grid')"
            :path="`blocks.${index}.props`"
          />
          <EditPricingTable
            v-else-if="block.type === 'pricing_table'"
            :model-value="propsOf(block, 'pricing_table')"
            :path="`blocks.${index}.props`"
          />
          <EditLatestArticles
            v-else-if="block.type === 'latest_articles'"
            :model-value="propsOf(block, 'latest_articles')"
            :path="`blocks.${index}.props`"
          />
          <EditStats
            v-else-if="block.type === 'stats'"
            :model-value="propsOf(block, 'stats')"
            :path="`blocks.${index}.props`"
          />
          <EditCta
            v-else-if="block.type === 'cta'"
            :model-value="propsOf(block, 'cta')"
            :path="`blocks.${index}.props`"
          />
        </div>
      </li>
    </ol>

    <UDropdownMenu
      :items="addItems"
      :content="{ align: 'start' }"
      :ui="{ content: 'w-80', itemDescription: 'text-xs' }"
    >
      <UButton
        label="Add block"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        block
        class="border-dashed"
      />
    </UDropdownMenu>

    <UModal
      :open="confirmRemove !== null"
      title="Delete this block?"
      description="Its content is removed when you save the page."
      @update:open="value => { if (!value) confirmRemove = null }"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="confirmRemove = null"
          />
          <UButton
            label="Delete block"
            color="error"
            @click="confirmRemove !== null && remove(confirmRemove)"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
