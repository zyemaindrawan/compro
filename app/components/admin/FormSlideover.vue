<script setup lang="ts">
defineProps<{
  title: string
  formId: string
  submitLabel: string
  saving: boolean
}>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="title"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <slot />
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          type="submit"
          :form="formId"
          :label="submitLabel"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
