<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { passwordChangeSchema, profileSchema, type PasswordChangeInput, type ProfileInput } from '#shared/schemas/auth.schema'
import type { AdminProfile, MfaFactor } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Account & security' })

const api = useApi()
const notify = useNotify()
const session = useAdminSession()
const format = useFormat()

const { data, refresh } = await useAsyncData('admin-account', () =>
  api<{ profile: AdminProfile, factors: MfaFactor[] }>('/api/admin/account/profile'))

const profileForm = useTemplateRef('profileForm')
const profileState = ref<ProfileInput>({
  display_name: data.value?.profile.displayName ?? '',
  bio: data.value?.profile.bio ?? '',
  avatar_media_id: data.value?.profile.avatar?.id ?? null,
})
const savingProfile = ref(false)

async function saveProfile(event: FormSubmitEvent<ProfileInput>) {
  savingProfile.value = true
  try {
    await api('/api/admin/account/profile', { method: 'PUT', body: event.data })
    await Promise.all([refresh(), session.refresh()])
    notify.success('Profile saved')
  }
  catch (error) {
    profileForm.value?.setErrors(apiFieldErrors(error))
    notify.error(error)
  }
  finally {
    savingProfile.value = false
  }
}

const passwordForm = useTemplateRef('passwordForm')
const passwordState = ref<PasswordChangeInput>({ currentPassword: '', password: '', confirm: '' })
const savingPassword = ref(false)

async function changePassword(event: FormSubmitEvent<PasswordChangeInput>) {
  savingPassword.value = true
  try {
    await api('/api/admin/account/password', { method: 'POST', body: event.data })
    passwordState.value = { currentPassword: '', password: '', confirm: '' }
    notify.success('Password changed', 'Other devices have been signed out.')
  }
  catch (error) {
    passwordForm.value?.setErrors(apiFieldErrors(error))
    notify.error(error, 'Password not changed')
  }
  finally {
    savingPassword.value = false
  }
}

const replacement = ref<{ factorId: string, qrCode: string, secret: string } | null>(null)
const replacing = ref(false)
const replaceError = ref('')

async function startReplacement() {
  replacing.value = true
  try {
    replacement.value = await api('/api/admin/account/factors/enroll', { method: 'POST' })
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    replacing.value = false
  }
}

async function confirmReplacement(code: string) {
  if (!replacement.value) return
  replacing.value = true
  replaceError.value = ''
  try {
    await api('/api/admin/account/factors/verify', { method: 'POST', body: { factorId: replacement.value.factorId, code } })
    replacement.value = null
    await refresh()
    notify.success('Authenticator replaced', 'Codes from the old device no longer work.')
  }
  catch (error) {
    replaceError.value = apiErrorMessage(error)
  }
  finally {
    replacing.value = false
  }
}

const signingOut = ref(false)
async function signOutOthers() {
  signingOut.value = true
  try {
    await api('/api/admin/account/sessions', { method: 'DELETE' })
    notify.success('Signed out of other devices')
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    signingOut.value = false
  }
}
</script>

<template>
  <AdminPanel
    id="account"
    title="Account & security"
  >
    <div class="mx-auto max-w-3xl space-y-6 pb-16">
      <UPageCard
        title="Profile"
        description="Shown as the author on articles."
        variant="subtle"
      >
        <UForm
          ref="profileForm"
          :schema="profileSchema"
          :state="profileState"
          class="space-y-4"
          @submit="saveProfile"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Display name"
              name="display_name"
              required
            >
              <UInput
                v-model="profileState.display_name"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Email">
              <UInput
                :model-value="data?.profile.email"
                disabled
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Short bio"
              name="bio"
              class="sm:col-span-2"
            >
              <UTextarea
                v-model="profileState.bio"
                :rows="3"
                :maxlength="500"
                autoresize
                class="w-full"
              />
            </UFormField>
          </div>
          <MediaField
            v-model="profileState.avatar_media_id"
            name="avatar_media_id"
            label="Photo"
            :initial="data?.profile.avatar"
          />
          <UButton
            type="submit"
            label="Save profile"
            :loading="savingProfile"
          />
        </UForm>
      </UPageCard>

      <UPageCard
        title="Password"
        description="At least 12 characters with upper and lower case letters and a number."
        variant="subtle"
      >
        <UForm
          ref="passwordForm"
          :schema="passwordChangeSchema"
          :state="passwordState"
          class="space-y-4"
          @submit="changePassword"
        >
          <UFormField
            label="Current password"
            name="currentPassword"
          >
            <UInput
              v-model="passwordState.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full sm:max-w-sm"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="New password"
              name="password"
            >
              <UInput
                v-model="passwordState.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Repeat new password"
              name="confirm"
            >
              <UInput
                v-model="passwordState.confirm"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </div>
          <UButton
            type="submit"
            label="Change password"
            :loading="savingPassword"
          />
        </UForm>
      </UPageCard>

      <UPageCard
        title="Two-factor authentication"
        variant="subtle"
      >
        <template #description>
          Required for every admin account. Move it to a new phone here before you reset the old one.
        </template>

        <ul
          v-if="data?.factors.length"
          class="divide-y divide-default rounded-lg border border-default"
        >
          <li
            v-for="factor in data.factors"
            :key="factor.id"
            class="flex items-center gap-3 px-3 py-2.5 text-sm"
          >
            <UIcon
              name="i-lucide-smartphone"
              class="size-4 text-muted"
            />
            <span class="flex-1">Authenticator app</span>
            <span class="text-muted">Added {{ format.date(factor.createdAt) }}</span>
          </li>
        </ul>

        <div
          v-if="replacement"
          class="space-y-4 rounded-lg border border-default p-4"
        >
          <TotpSetup
            :qr-code="replacement.qrCode"
            :secret="replacement.secret"
          />
          <OtpInput
            :loading="replacing"
            :error="replaceError"
            @submit="confirmReplacement"
          />
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="replacement = null"
          />
        </div>
        <div v-else>
          <UButton
            label="Move to a new device"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="replacing"
            @click="startReplacement"
          />
        </div>
      </UPageCard>

      <UPageCard
        title="Sessions"
        description="Sign out everywhere except this browser, for example after using a shared computer."
        variant="subtle"
      >
        <div>
          <UButton
            label="Sign out other devices"
            icon="i-lucide-log-out"
            color="neutral"
            variant="outline"
            :loading="signingOut"
            @click="signOutOthers"
          />
        </div>
      </UPageCard>
    </div>
  </AdminPanel>
</template>
