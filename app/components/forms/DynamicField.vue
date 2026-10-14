<script setup lang="ts">
import type { FormFieldDef } from '#shared/types/models'

const props = defineProps<{ field: FormFieldDef, eager?: boolean }>()
const model = defineModel<unknown>()

const AUTOCOMPLETE: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'tel',
  company: 'organization',
  website: 'url',
}

const INPUT_TYPES: Record<string, string> = {
  email: 'email',
  tel: 'tel',
  url: 'url',
  number: 'number',
  date: 'date',
}

const autocomplete = computed(() => AUTOCOMPLETE[props.field.name] ?? (props.field.type === 'email' ? 'email' : 'off'))

const text = computed({
  get: () => (typeof model.value === 'string' || typeof model.value === 'number' ? String(model.value) : ''),
  set: (value: string) => {
    model.value = value
  },
})

const list = computed({
  get: () => (Array.isArray(model.value) ? model.value.map(String) : []),
  set: (value: string[]) => {
    model.value = value
  },
})

const checked = computed({
  get: () => model.value === true,
  set: (value: boolean) => {
    model.value = value
  },
})
</script>

<template>
  <UFormField
    :name="field.name"
    :label="field.type === 'checkbox' ? undefined : field.label"
    :description="field.type === 'checkbox' ? undefined : field.helpText || undefined"
    :required="field.required"
    :eager-validation="eager"
    :class="field.width === 'half' ? 'sm:col-span-1' : 'sm:col-span-2'"
  >
    <UTextarea
      v-if="field.type === 'textarea'"
      v-model="text"
      :name="field.name"
      :placeholder="field.placeholder"
      :rows="5"
      autoresize
      :maxrows="14"
      class="w-full"
    />
    <select
      v-else-if="field.type === 'select'"
      v-model="text"
      :aria-label="field.label"
      :name="field.name"
      class="w-full rounded-md bg-default px-2.5 py-1.5 text-sm text-highlighted ring ring-accented ring-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <option value="">
        {{ field.placeholder || 'Choose one' }}
      </option>
      <option
        v-for="option in field.options"
        :key="option.value"
        :value="option.value"
        :selected="option.value === text"
      >
        {{ option.label }}
      </option>
    </select>
    <URadioGroup
      v-else-if="field.type === 'radio' || field.type === 'budget_range'"
      v-model="text"
      :name="field.name"
      :items="field.options"
      variant="card"
      :ui="{ fieldset: 'gap-2' }"
    />
    <UCheckboxGroup
      v-else-if="field.type === 'checkbox_group'"
      v-model="list"
      :name="field.name"
      :items="field.options"
      variant="card"
      :ui="{ fieldset: 'gap-2' }"
    />
    <UCheckbox
      v-else-if="field.type === 'checkbox'"
      v-model="checked"
      :name="field.name"
      :label="field.label"
      :description="field.helpText || undefined"
      :required="field.required"
    />
    <UInput
      v-else
      v-model="text"
      :name="field.name"
      :type="INPUT_TYPES[field.type] ?? 'text'"
      :placeholder="field.placeholder"
      :autocomplete="autocomplete"
      :min="field.validation.min"
      :max="field.validation.max"
      class="w-full"
    />
  </UFormField>
</template>
