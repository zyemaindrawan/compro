<script setup lang="ts">
import type { SocialLinkInput } from '#shared/schemas/settings.schema'

const model = defineModel<SocialLinkInput[]>({ required: true })

function add() {
  model.value = [...model.value, { platform: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin', url: '', is_active: true }]
}

function update(index: number, link: SocialLinkInput) {
  model.value = model.value.map((item, i) => (i === index ? link : item))
}

function move(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= model.value.length) return
  const next = [...model.value]
  const [item] = next.splice(index, 1)
  if (item) next.splice(target, 0, item)
  model.value = next
}

function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-3">
    <ul
      v-if="model.length"
      class="space-y-3"
    >
      <SocialLinkRow
        v-for="(link, index) in model"
        :key="link.id ?? `new-${index}`"
        :model-value="link"
        :index="index"
        :first="index === 0"
        :last="index === model.length - 1"
        @update:model-value="update(index, $event)"
        @move="move(index, $event)"
        @remove="remove(index)"
      />
    </ul>
    <p
      v-else
      class="text-sm text-muted"
    >
      No social links yet.
    </p>
    <UButton
      label="Add link"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      size="sm"
      :disabled="model.length >= 20"
      @click="add"
    />
  </div>
</template>
