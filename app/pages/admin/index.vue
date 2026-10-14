<script setup lang="ts">
import type { DashboardStats } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Dashboard' })

const api = useApi()
const session = useAdminSession()
const { data: stats, status } = await useAsyncData<DashboardStats>('admin-dashboard', () => api('/api/admin/dashboard'))

const greeting = computed(() => {
  const name = session.state.value.profile?.displayName?.split(' ')[0]
  return name ? `Welcome back, ${name}` : 'Welcome back'
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
        />
        <StatCard
          label="Media files"
          :value="stats.mediaFiles"
          icon="i-lucide-images"
          to="/admin/media"
        />
      </div>

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
