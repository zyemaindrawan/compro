<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'form'>>({ required: true })

const api = useApi()
const { data: forms } = useAsyncData('admin-form-options', () => api<{ key: string, name: string }[]>('/api/admin/forms/options'), { default: () => [] })
const options = computed(() => forms.value.map(form => ({ label: form.name, value: form.key })))
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Form"
      :name="`${path}.form_key`"
      required
    >
      <USelect
        v-model="block.form_key"
        :items="options"
        placeholder="Choose a form"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Heading"
      :name="`${path}.heading`"
    >
      <UInput
        v-model="block.heading"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Intro"
      :name="`${path}.intro`"
    >
      <UTextarea
        v-model="block.intro"
        :rows="2"
        :maxlength="300"
        autoresize
        class="w-full"
      />
    </UFormField>
  </div>
</template>
