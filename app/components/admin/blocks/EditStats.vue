<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'stats'>>({ required: true })

function add() {
  block.value.items.push({ value: '', label: '' })
}

function remove(index: number) {
  block.value.items.splice(index, 1)
}
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Heading"
      :name="`${path}.heading`"
    >
      <UInput
        v-model="block.heading"
        class="w-full"
      />
    </UFormField>
    <ul class="space-y-2">
      <li
        v-for="(item, index) in block.items"
        :key="index"
        class="grid grid-cols-[6rem_1fr_auto] items-start gap-2"
      >
        <UFormField :name="`${path}.items.${index}.value`">
          <UInput
            v-model="item.value"
            placeholder="60+"
            aria-label="Number"
            class="w-full"
          />
        </UFormField>
        <UFormField :name="`${path}.items.${index}.label`">
          <UInput
            v-model="item.label"
            placeholder="Projects shipped"
            aria-label="Label"
            class="w-full"
          />
        </UFormField>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          aria-label="Remove number"
          :disabled="block.items.length === 1"
          @click="remove(index)"
        />
      </li>
    </ul>
    <UButton
      label="Add number"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      size="sm"
      :disabled="block.items.length >= 6"
      @click="add"
    />
  </div>
</template>
