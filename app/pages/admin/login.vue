<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { loginSchema, type LoginInput } from '#shared/schemas/auth.schema'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Sign in', robots: 'noindex, nofollow' })

const route = useRoute()
const session = useAdminSession()
const loading = ref(false)
const errorMessage = ref('')

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@company.com', autocomplete: 'username', required: true },
  { name: 'password', type: 'password', label: 'Password', autocomplete: 'current-password', required: true },
]

async function onSubmit(event: FormSubmitEvent<LoginInput>) {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch('/api/auth/login', { method: 'POST', body: event.data })
    await session.refresh()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin') ? route.query.redirect : '/admin'
    await navigateTo(result.next === 'done' ? redirect : { path: '/admin/mfa', query: { redirect } })
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UPageCard variant="subtle">
    <UAuthForm
      :schema="loginSchema"
      :fields="fields"
      title="Sign in to the dashboard"
      icon="i-lucide-lock-keyhole"
      :submit="{ label: 'Continue', block: true }"
      :loading="loading"
      @submit="onSubmit"
    >
      <template #validation>
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="errorMessage"
        />
      </template>
      <template #footer>
        <p class="text-center text-xs text-muted">
          Two-factor authentication is required for every admin account.
        </p>
      </template>
    </UAuthForm>
  </UPageCard>
</template>
