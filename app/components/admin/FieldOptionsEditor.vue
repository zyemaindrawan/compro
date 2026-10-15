<script setup lang="ts">
const props = defineProps<{ path: string }>()
const options = defineModel<{ label: string, value: string }[]>({ required: true })

function add() {
  options.value = [...options.value, { label: '', value: '' }]
}

function remove(index: number) {
  options.value = options.value.filter((_, position) => position !== index)
}

function setLabel(index: number, label: string) {
  options.value = options.value.map((option, position) => {
    if (position !== index) return option
    const autoValue = !option.value || option.value === slugify(option.label)
    return { label, value: autoValue ? slugify(label) : option.value }
  })
}

function setValue(index: number, value: string) {
  options.value = options.value.map((option, position) => (position === index ? { ...option, value } : option))
}
</script>

<template>
  <UFormField
    label="Options"
    :name="`${props.path}.options`"
    help="The value is stored with each submission and used in exports."
  >
    <div class="space-y-2">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
      >
        <UFormField :name="`${props.path}.options.${index}.label`">
          <UInput
            :model-value="option.label"
            placeholder="Label"
            :aria-label="`Option ${index + 1} label`"
            class="w-full"
            @update:model-value="value => setLabel(index, String(value))"
          />
        </UFormField>
        <UFormField :name="`${props.path}.options.${index}.value`">
          <UInput
            :model-value="option.value"
            placeholder="value"
            :aria-label="`Option ${index + 1} value`"
            class="w-full font-mono"
            @update:model-value="value => setValue(index, String(value))"
          />
        </UFormField>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          :aria-label="`Remove option ${index + 1}`"
          @click="remove(index)"
        />
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Add option"
        color="neutral"
        variant="outline"
        size="sm"
        @click="add"
      />
    </div>
  </UFormField>
</template>
