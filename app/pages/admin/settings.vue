<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { settingsUpdateSchema, type SettingsUpdateInput } from '#shared/schemas/settings.schema'
import type { SiteSettings } from '#shared/types/models'
import { LAYOUT_KEY } from '~/composables/useSiteSettings'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Settings' })

const api = useApi()
const notify = useNotify()
const form = useTemplateRef('form')
const saving = ref(false)

const { data: settings } = await useAsyncData<SiteSettings>('admin-settings', () => api('/api/admin/settings'))

function toInput(value: SiteSettings): SettingsUpdateInput {
  return {
    site_name: value.siteName,
    title_template: value.titleTemplate,
    tagline: value.tagline,
    description: value.description,
    logo_light_media_id: value.logoLight?.id ?? null,
    logo_dark_media_id: value.logoDark?.id ?? null,
    favicon_media_id: value.favicon?.id ?? null,
    default_og_media_id: value.defaultOg?.id ?? null,
    phone: value.phone,
    whatsapp_number: value.whatsappNumber,
    whatsapp_message: value.whatsappMessage,
    email: value.email,
    address: value.address,
    map_url: value.mapUrl,
    work_hours: value.workHours.map(entry => ({ ...entry })),
    timezone: value.timezone,
    umami_website_id: value.umamiWebsiteId,
    umami_script_url: value.umamiScriptUrl,
    marquee: { autoplay: value.marquee.autoplay, speed: value.marquee.speed, pause_on_hover: value.marquee.pauseOnHover },
    social_links: value.socialLinks.map(link => ({ id: link.id, platform: link.platform, label: link.label, url: link.url, icon: link.icon, is_active: link.isActive })),
  }
}

if (!settings.value) throw createError({ statusCode: 500, message: 'Settings could not be loaded.' })
const state = ref<SettingsUpdateInput>(toInput(settings.value))
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
useUnsavedGuard(isDirty)

const timezones = Intl.supportedValuesOf('timeZone')

async function onSubmit(event: FormSubmitEvent<SettingsUpdateInput>) {
  saving.value = true
  try {
    const updated = await api<SiteSettings>('/api/admin/settings', { method: 'PUT', body: event.data })
    settings.value = updated
    state.value = toInput(updated)
    baseline.value = JSON.stringify(state.value)
    await refreshNuxtData(LAYOUT_KEY)
    notify.success('Settings saved', 'The public site uses the new values right away.')
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Settings were not saved')
  }
  finally {
    saving.value = false
  }
}

defineShortcuts({
  meta_s: () => form.value?.submit(),
})
</script>

<template>
  <AdminPanel
    id="settings"
    title="Settings"
  >
    <template #actions>
      <UBadge
        v-if="isDirty"
        label="Unsaved changes"
        color="warning"
        variant="subtle"
        class="hidden sm:inline-flex"
      />
      <UButton
        label="Save"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="!isDirty"
        @click="form?.submit()"
      />
    </template>

    <UForm
      ref="form"
      :schema="settingsUpdateSchema"
      :state="state"
      class="mx-auto w-full max-w-3xl space-y-6 pb-16"
      @submit="onSubmit"
    >
      <UPageCard
        title="Identity"
        description="How the site introduces itself in the header, search results and browser tabs."
        variant="subtle"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Site name"
            name="site_name"
            required
          >
            <UInput
              v-model="state.site_name"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Title template"
            name="title_template"
            help="%s is replaced by the page title."
          >
            <UInput
              v-model="state.title_template"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Tagline"
            name="tagline"
            class="sm:col-span-2"
            help="Short line under the logo and on the home page."
          >
            <UInput
              v-model="state.tagline"
              :maxlength="160"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Default meta description"
            name="description"
            class="sm:col-span-2"
            :help="`${state.description.length}/160 recommended`"
          >
            <UTextarea
              v-model="state.description"
              :rows="3"
              :maxlength="300"
              autoresize
              class="w-full"
            />
          </UFormField>
        </div>
        <USeparator />
        <div class="grid gap-5 sm:grid-cols-2">
          <MediaField
            v-model="state.logo_light_media_id"
            name="logo_light_media_id"
            label="Logo (light background)"
            purpose="logo"
            :initial="settings?.logoLight"
          />
          <MediaField
            v-model="state.logo_dark_media_id"
            name="logo_dark_media_id"
            label="Logo (dark background)"
            purpose="logo"
            :initial="settings?.logoDark"
            help="Falls back to the light logo."
          />
          <MediaField
            v-model="state.favicon_media_id"
            name="favicon_media_id"
            label="Favicon"
            purpose="favicon"
            :initial="settings?.favicon"
            help="Square image, saved as 512 × 512 PNG."
          />
          <MediaField
            v-model="state.default_og_media_id"
            name="default_og_media_id"
            label="Default social image"
            :initial="settings?.defaultOg"
            help="1200 × 630 works best."
          />
        </div>
        <UAlert
          v-if="!state.default_og_media_id"
          color="warning"
          variant="subtle"
          icon="i-lucide-image-off"
          title="No default social image"
          description="Pages without their own image are shared on social media and chat apps without a preview. Upload one before launch."
          class="mt-4"
        />
      </UPageCard>

      <UPageCard
        title="Contact"
        description="Shown in the footer, the contact page and the WhatsApp button."
        variant="subtle"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Phone"
            name="phone"
          >
            <UInput
              v-model="state.phone"
              type="tel"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="WhatsApp number"
            name="whatsapp_number"
            help="Country code and digits only. Leave empty to hide the button."
          >
            <UInput
              v-model="state.whatsapp_number"
              inputmode="numeric"
              placeholder="6281200001234"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Default WhatsApp message"
            name="whatsapp_message"
          >
            <UInput
              v-model="state.whatsapp_message"
              :maxlength="300"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Address"
            name="address"
            class="sm:col-span-2"
          >
            <UTextarea
              v-model="state.address"
              :rows="2"
              autoresize
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Map link"
            name="map_url"
            class="sm:col-span-2"
            help="A Google Maps or OpenStreetMap share link."
          >
            <UInput
              v-model="state.map_url"
              type="url"
              placeholder="https://"
              class="w-full"
            />
          </UFormField>
        </div>
      </UPageCard>

      <UPageCard
        title="Working hours"
        variant="subtle"
      >
        <template #description>
          Times are in the site time zone below.
        </template>
        <WorkHoursEditor v-model="state.work_hours" />
        <UFormField
          label="Time zone"
          name="timezone"
          help="Used for working hours and every date shown on the site."
        >
          <USelectMenu
            v-model="state.timezone"
            :items="timezones"
            class="w-full sm:w-72"
          />
        </UFormField>
      </UPageCard>

      <UPageCard
        title="Social links"
        description="Displayed as icons in the footer, in this order."
        variant="subtle"
      >
        <SocialLinksEditor v-model="state.social_links" />
      </UPageCard>

      <UPageCard
        title="Client logo strip"
        description="Controls the scrolling logo row on the home page."
        variant="subtle"
      >
        <div class="grid gap-4 sm:grid-cols-3 sm:items-end">
          <USwitch
            v-model="state.marquee.autoplay"
            label="Scroll automatically"
          />
          <USwitch
            v-model="state.marquee.pause_on_hover"
            label="Pause on hover"
          />
          <UFormField
            label="Speed (seconds per loop)"
            name="marquee.speed"
          >
            <UInputNumber
              v-model="state.marquee.speed"
              :min="10"
              :max="120"
              class="w-full"
            />
          </UFormField>
        </div>
      </UPageCard>

      <UPageCard
        title="Analytics"
        description="Umami is cookie-free, so no consent banner is needed."
        variant="subtle"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Umami website ID"
            name="umami_website_id"
            help="Leave empty to turn analytics off."
          >
            <UInput
              v-model="state.umami_website_id"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="w-full font-mono"
            />
          </UFormField>
          <UFormField
            label="Script URL"
            name="umami_script_url"
          >
            <UInput
              v-model="state.umami_script_url"
              type="url"
              class="w-full"
            />
          </UFormField>
        </div>
      </UPageCard>
    </UForm>
  </AdminPanel>
</template>
