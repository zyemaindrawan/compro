<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Two-factor authentication', robots: 'noindex, nofollow' })

const route = useRoute()
const session = useAdminSession()
const notify = useNotify()

const mode = computed(() => session.state.value.next)
const enrollment = ref<{ factorId: string, qrCode: string, secret: string } | null>(null)
const loading = ref(false)
const error = ref('')

async function startEnrollment() {
  loading.value = true
  try {
    enrollment.value = await $fetch('/api/auth/mfa/enroll', { method: 'POST' })
  }
  catch (err) {
    notify.error(err, 'Could not start two-factor setup')
  }
  finally {
    loading.value = false
  }
}

async function verify(code: string) {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/mfa/verify', {
      method: 'POST',
      body: { code, factorId: enrollment.value?.factorId },
    })
    await session.refresh()
    if (enrollment.value) notify.success('Two-factor authentication is on')
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin') ? route.query.redirect : '/admin'
    await navigateTo(redirect)
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (mode.value === 'enroll') startEnrollment()
})
</script>

<template>
  <UPageCard variant="subtle">
    <div class="space-y-6">
      <div class="space-y-1 text-center">
        <UIcon
          name="i-lucide-shield-check"
          class="mx-auto size-8 text-primary"
        />
        <h1 class="text-xl font-semibold text-highlighted">
          {{ mode === 'enroll' ? 'Set up two-factor authentication' : 'Verify it is you' }}
        </h1>
        <p class="text-sm text-muted">
          {{ mode === 'enroll' ? 'Admin accounts need an authenticator app before they can continue.' : 'Enter the code from your authenticator app.' }}
        </p>
      </div>

      <template v-if="mode === 'enroll'">
        <TotpSetup
          v-if="enrollment"
          :qr-code="enrollment.qrCode"
          :secret="enrollment.secret"
        />
        <USkeleton
          v-else
          class="h-72 w-full"
        />
      </template>

      <OtpInput
        :loading="loading"
        :error="error"
        @submit="verify"
      />

      <UButton
        label="Use a different account"
        color="neutral"
        variant="link"
        block
        @click="session.logout()"
      />
    </div>
  </UPageCard>
</template>
