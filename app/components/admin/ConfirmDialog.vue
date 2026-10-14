<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
}>(), {
  description: undefined,
  confirmLabel: 'Delete',
})

const emit = defineEmits<{ confirm: [], cancel: [] }>()
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    @update:open="value => { if (!value) emit('cancel') }"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('cancel')"
        />
        <UButton
          :label="confirmLabel"
          color="error"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
