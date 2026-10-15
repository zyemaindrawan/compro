<script setup lang="ts">
defineProps<{
  qrCode: string
  secret: string
}>()

const { copy, copied } = useClipboard()
</script>

<template>
  <div class="space-y-4">
    <ol class="list-decimal space-y-1 ps-5 text-sm text-muted">
      <li>Open an authenticator app such as 1Password, Google Authenticator or Aegis.</li>
      <li>Scan the QR code, or enter the setup key by hand.</li>
      <li>Type the 6-digit code the app shows.</li>
    </ol>
    <div class="flex justify-center rounded-lg bg-white p-4">
      <img
        :src="qrCode"
        alt="QR code for your authenticator app"
        width="176"
        height="176"
        class="size-44"
      >
    </div>
    <UFormField label="Setup key">
      <UInput
        :model-value="secret"
        readonly
        class="w-full font-mono"
        :ui="{ base: 'text-xs tracking-wider' }"
      >
        <template #trailing>
          <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            color="neutral"
            variant="link"
            size="sm"
            :aria-label="copied ? 'Copied' : 'Copy setup key'"
            @click="copy(secret)"
          />
        </template>
      </UInput>
    </UFormField>
  </div>
</template>
