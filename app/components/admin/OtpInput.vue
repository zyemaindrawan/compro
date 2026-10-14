<script setup lang="ts">
const props = defineProps<{ loading?: boolean, error?: string }>()
const emit = defineEmits<{ submit: [code: string] }>()

const digits = ref<(number | undefined)[]>([])

watch(() => props.error, (value) => {
  if (value) digits.value = []
})

function onComplete(value: (number | undefined)[]) {
  emit('submit', value.join(''))
}
</script>

<template>
  <UFormField
    :error="error || undefined"
    label="Authentication code"
    class="space-y-2"
  >
    <UPinInput
      v-model="digits"
      :length="6"
      type="number"
      otp
      autofocus
      size="xl"
      :disabled="loading"
      :highlight="Boolean(error)"
      :color="error ? 'error' : 'primary'"
      class="justify-center"
      @complete="onComplete"
    />
  </UFormField>
</template>
