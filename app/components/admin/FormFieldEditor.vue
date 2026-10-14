<script setup lang="ts">
import { FORM_FIELD_TYPES, OPTION_FIELD_TYPES, type FormFieldInput } from '#shared/schemas/engagement.schema'

const props = defineProps<{ index: number, locked: boolean }>()
const field = defineModel<FormFieldInput>({ required: true })

const TYPE_LABELS: Record<(typeof FORM_FIELD_TYPES)[number], string> = {
  text: 'Short text',
  email: 'Email',
  tel: 'Phone',
  url: 'Website',
  textarea: 'Long text',
  select: 'Dropdown',
  radio: 'Single choice',
  checkbox: 'Checkbox',
  checkbox_group: 'Multiple choice',
  number: 'Number',
  budget_range: 'Budget range',
  date: 'Date',
}

const typeItems = FORM_FIELD_TYPES.map(type => ({ label: TYPE_LABELS[type], value: type }))
const widthItems = [{ label: 'Full width', value: 'full' }, { label: 'Half width', value: 'half' }]
const path = computed(() => `fields.${props.index}`)
const hasOptions = computed(() => (OPTION_FIELD_TYPES as readonly string[]).includes(field.value.type))
const hasLimits = computed(() => ['text', 'textarea', 'number'].includes(field.value.type))
const limitUnit = computed(() => (field.value.type === 'number' ? 'value' : 'characters'))

function fieldName(label: string) {
  const name = slugify(label).replace(/-/g, '_').replace(/^[^a-z]+/, '')
  return name.slice(0, 40) || 'field'
}

function update(patch: Partial<FormFieldInput>) {
  field.value = { ...field.value, ...patch }
}

function setLabel(label: string) {
  const autoName = !props.locked && (!field.value.name || field.value.name === fieldName(field.value.label))
  update(autoName ? { label, name: fieldName(label) } : { label })
}

function setLimit(key: 'min' | 'max', value: number | null) {
  const { [key]: _previous, ...rest } = field.value.validation
  const valid = value !== null && !Number.isNaN(value)
  update({ validation: valid ? { ...rest, [key]: value } : rest })
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <UFormField
      label="Label"
      :name="`${path}.label`"
      required
    >
      <UInput
        :model-value="field.label"
        class="w-full"
        @update:model-value="value => setLabel(String(value))"
      />
    </UFormField>
    <UFormField
      label="Field name"
      :name="`${path}.name`"
      :help="locked ? 'Kept so existing submissions still match.' : 'Used in exports and emails.'"
      required
    >
      <UInput
        :model-value="field.name"
        :disabled="locked"
        class="w-full font-mono"
        @update:model-value="value => update({ name: String(value) })"
      />
    </UFormField>
    <UFormField
      label="Type"
      :name="`${path}.type`"
    >
      <USelect
        :model-value="field.type"
        :items="typeItems"
        class="w-full"
        @update:model-value="value => update({ type: value as FormFieldInput['type'] })"
      />
    </UFormField>
    <UFormField
      label="Width"
      :name="`${path}.width`"
      help="Half-width fields sit side by side on larger screens."
    >
      <USelect
        :model-value="field.width"
        :items="widthItems"
        class="w-full"
        @update:model-value="value => update({ width: value as FormFieldInput['width'] })"
      />
    </UFormField>
    <UFormField
      v-if="field.type !== 'checkbox' && !hasOptions"
      label="Placeholder"
      :name="`${path}.placeholder`"
    >
      <UInput
        :model-value="field.placeholder"
        class="w-full"
        @update:model-value="value => update({ placeholder: String(value) })"
      />
    </UFormField>
    <UFormField
      v-if="field.type === 'select'"
      label="Empty choice text"
      :name="`${path}.placeholder`"
    >
      <UInput
        :model-value="field.placeholder"
        placeholder="Choose one"
        class="w-full"
        @update:model-value="value => update({ placeholder: String(value) })"
      />
    </UFormField>
    <UFormField
      label="Help text"
      :name="`${path}.help_text`"
      :class="field.type === 'checkbox' || hasOptions ? 'sm:col-span-2' : ''"
    >
      <UInput
        :model-value="field.help_text"
        class="w-full"
        @update:model-value="value => update({ help_text: String(value) })"
      />
    </UFormField>
    <template v-if="hasLimits">
      <UFormField
        :label="`Minimum (${limitUnit})`"
        :name="`${path}.validation.min`"
      >
        <UInputNumber
          :model-value="field.validation.min ?? null"
          :min="0"
          class="w-full"
          @update:model-value="value => setLimit('min', value)"
        />
      </UFormField>
      <UFormField
        :label="`Maximum (${limitUnit})`"
        :name="`${path}.validation.max`"
      >
        <UInputNumber
          :model-value="field.validation.max ?? null"
          :min="1"
          class="w-full"
          @update:model-value="value => setLimit('max', value)"
        />
      </UFormField>
    </template>
    <FieldOptionsEditor
      v-if="hasOptions"
      :model-value="field.options"
      :path="path"
      class="sm:col-span-2"
      @update:model-value="value => update({ options: value })"
    />
    <USwitch
      :model-value="field.required"
      label="Required"
      class="sm:col-span-2"
      @update:model-value="value => update({ required: value })"
    />
  </div>
</template>
