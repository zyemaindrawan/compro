<script setup lang="ts">
import type { DashboardStats, LaunchChecks } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Dashboard' })

const api = useApi()
const session = useAdminSession()
const format = useFormat()
const { data: stats, status } = await useAsyncData<DashboardStats>('admin-dashboard', () => api('/api/admin/dashboard'))

const greeting = computed(() => {
  const name = session.state.value.profile?.displayName?.split(' ')[0]
  return name ? `Welcome back, ${name}` : 'Welcome back'
})

const CHECK_LABELS: Record<keyof LaunchChecks, { label: string, fix: string }> = {
  defaultOgImage: { label: 'Default social image', fix: 'Upload one under Settings → Identity.' },
  smtp: { label: 'Email notifications', fix: 'Set NUXT_SMTP_HOST, NUXT_SMTP_USER, NUXT_SMTP_PASS and NUXT_SMTP_FROM.' },
  turnstile: { label: 'Spam protection', fix: 'Set NUXT_TURNSTILE_SECRET_KEY and NUXT_PUBLIC_TURNSTILE_SITE_KEY.' },
  ipHashSalt: { label: 'IP hash salt', fix: 'Set NUXT_IP_HASH_SALT to a random string of 16 or more characters.' },
  trustProxy: { label: 'Visitor IP behind the proxy', fix: 'Set NUXT_TRUST_PROXY. See docs/DEPLOYMENT.md.' },
}

const missingChecks = computed(() => {
  const checks = stats.value?.checks
  if (!checks) return []
  return (Object.keys(CHECK_LABELS) as (keyof LaunchChecks)[]).filter(key => !checks[key]).map(key => CHECK_LABELS[key])
})

const shortcuts = [
  { label: 'Upload images', description: 'Add logos, covers and screenshots to the media library.', icon: 'i-lucide-upload', to: '/admin/media' },
  { label: 'Edit site settings', description: 'Name, logo, contact details, social links and working hours.', icon: 'i-lucide-settings-2', to: '/admin/settings' },
  { label: 'Review account security', description: 'Change your password or move two-factor to a new device.', icon: 'i-lucide-shield-check', to: '/admin/account' },
]
</script>

<template>
  <AdminPanel
    id="dashboard"
    title="Dashboard"
  >
    <div class="space-y-8">
      <p class="font-display text-2xl font-semibold text-highlighted">
        {{ greeting }}
      </p>

      <UAlert
        v-if="missingChecks.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-list-checks"
        title="Launch checklist"
      >
        <template #description>
          <ul class="mt-1 space-y-1">
            <li
              v-for="check in missingChecks"
              :key="check.label"
            >
              <span class="font-medium">{{ check.label }}:</span> {{ check.fix }}
            </li>
          </ul>
        </template>
      </UAlert>

      <div
        v-if="status === 'pending'"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-24"
        />
      </div>
      <div
        v-else-if="stats"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Published articles"
          :value="stats.publishedArticles"
          icon="i-lucide-newspaper"
        />
        <StatCard
          label="Drafts"
          :value="stats.draftArticles"
          icon="i-lucide-file-pen-line"
        />
        <StatCard
          label="New submissions"
          :value="stats.newSubmissions"
          icon="i-lucide-inbox"
          to="/admin/submissions"
        />
        <StatCard
          label="Media files"
          :value="stats.mediaFiles"
          icon="i-lucide-images"
          to="/admin/media"
        />
      </div>

      <section
        v-if="stats"
        class="space-y-3"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-highlighted">
            Latest submissions
          </h2>
          <UButton
            to="/admin/submissions?status=all"
            label="Open inbox"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="link"
            size="sm"
          />
        </div>
        <ul
          v-if="stats.latestSubmissions.length"
          class="divide-y divide-default rounded-lg border border-default"
        >
          <li
            v-for="item in stats.latestSubmissions"
            :key="item.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
          >
            <NuxtLink
              :to="`/admin/submissions/${item.id}`"
              class="min-w-0 flex-1 truncate font-medium text-highlighted hover:text-primary"
            >
              {{ item.name || item.email }}
              <span class="font-normal text-muted">· {{ item.formName }}</span>
            </NuxtLink>
            <UBadge
              :label="SUBMISSION_STATUS_META[item.status].label"
              :color="SUBMISSION_STATUS_META[item.status].color"
              variant="subtle"
              size="sm"
            />
            <span class="w-full text-xs text-muted sm:w-auto">{{ format.dateTime(item.createdAt) }}</span>
          </li>
        </ul>
        <p
          v-else
          class="rounded-lg border border-dashed border-default px-4 py-6 text-center text-sm text-muted"
        >
          No submissions yet. Contact and quote requests appear here.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-highlighted">
          Shortcuts
        </h2>
        <div class="grid gap-4 md:grid-cols-3">
          <UPageCard
            v-for="item in shortcuts"
            :key="item.to"
            :title="item.label"
            :description="item.description"
            :icon="item.icon"
            :to="item.to"
            variant="outline"
          />
        </div>
      </section>
    </div>
  </AdminPanel>
</template>
