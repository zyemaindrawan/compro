<script setup lang="ts">
defineProps<{ label: string, path: string }>()
const link = defineModel<{ label: string, href: string }>({ required: true })
</script>

<template>
  <fieldset class="grid gap-3 sm:grid-cols-2">
    <legend class="mb-1.5 text-sm font-medium text-default">
      {{ label }}
    </legend>
    <UFormField :name="`${path}.label`">
      <UInput
        v-model="link.label"
        placeholder="Button text"
        aria-label="Button text"
        class="w-full"
      />
    </UFormField>
    <UFormField :name="`${path}.href`">
      <UInput
        v-model="link.href"
        placeholder="/contact or https://"
        aria-label="Link"
        class="w-full"
      />
    </UFormField>
  </fieldset>
</template>
