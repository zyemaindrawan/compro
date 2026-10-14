<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const session = useAdminSession()
const colorMode = useColorMode()

const navigation: NavigationMenuItem[][] = [
  [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
    { label: 'Articles', icon: 'i-lucide-newspaper', to: '/admin/articles' },
    { label: 'Categories', icon: 'i-lucide-folder-tree', to: '/admin/categories' },
    { label: 'Pages', icon: 'i-lucide-layout-template', to: '/admin/pages' },
    { label: 'Services', icon: 'i-lucide-briefcase', to: '/admin/services' },
    { label: 'Pricing', icon: 'i-lucide-tags', to: '/admin/pricing' },
    { label: 'Media', icon: 'i-lucide-images', to: '/admin/media' },
  ],
  [
    { label: 'Settings', icon: 'i-lucide-settings-2', to: '/admin/settings' },
    { label: 'View site', icon: 'i-lucide-external-link', to: '/', target: '_blank' },
  ],
]

const profile = computed(() => session.state.value.profile)

const userMenu = computed<DropdownMenuItem[][]>(() => [
  [{ label: profile.value?.email ?? 'Account', type: 'label' }],
  [
    { label: 'Account & security', icon: 'i-lucide-shield-check', to: '/admin/account' },
    {
      label: colorMode.value === 'dark' ? 'Light mode' : 'Dark mode',
      icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: () => {
        colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
      },
    },
  ],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', color: 'error', onSelect: () => session.logout() }],
])
</script>

<template>
  <UDashboardGroup
    unit="rem"
    storage="local"
  >
    <UDashboardSidebar
      id="admin-sidebar"
      collapsible
      :default-size="15"
      :collapsed-size="4"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <AppLogo
          v-if="!collapsed"
          to="/admin"
        />
        <UIcon
          v-else
          name="i-lucide-panels-top-left"
          class="mx-auto size-5 text-primary"
        />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navigation[0]"
          orientation="vertical"
          tooltip
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navigation[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu
          :items="userMenu"
          :content="{ align: 'start', side: 'top' }"
          class="w-full"
        >
          <UButton
            :avatar="profile?.avatar ? { src: profile.avatar.url, alt: profile.displayName } : undefined"
            :icon="profile?.avatar ? undefined : 'i-lucide-circle-user'"
            :label="collapsed ? undefined : profile?.displayName"
            :square="collapsed"
            color="neutral"
            variant="ghost"
            block
            trailing-icon="i-lucide-chevrons-up-down"
            :ui="{ trailingIcon: collapsed ? 'hidden' : 'ms-auto text-dimmed' }"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
