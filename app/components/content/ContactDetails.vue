<script setup lang="ts">
const { settings } = useSiteSettings()
const hours = computed(() => summarizeWorkHours(settings.value?.workHours ?? []))

const whatsapp = computed(() => {
  const number = settings.value?.whatsappNumber
  if (!number) return null
  const text = settings.value?.whatsappMessage
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
})

const channels = computed(() => {
  const value = settings.value
  if (!value) return []
  return [
    value.email ? { icon: 'i-lucide-mail', label: 'Email', text: value.email, href: `mailto:${value.email}`, external: false } : null,
    whatsapp.value ? { icon: 'i-simple-icons-whatsapp', label: 'WhatsApp', text: 'Chat with us', href: whatsapp.value, external: true } : null,
    value.phone ? { icon: 'i-lucide-phone', label: 'Phone', text: value.phone, href: `tel:${value.phone.replace(/[^+\d]/g, '')}`, external: false } : null,
  ].filter(channel => channel !== null)
})
</script>

<template>
  <address class="space-y-8 not-italic">
    <ul
      v-if="channels.length"
      class="space-y-4"
    >
      <li
        v-for="channel in channels"
        :key="channel.label"
        class="flex items-start gap-3"
      >
        <UIcon
          :name="channel.icon"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />
        <span class="text-sm">
          <span class="block text-muted">{{ channel.label }}</span>
          <a
            :href="channel.href"
            :target="channel.external ? '_blank' : undefined"
            :rel="channel.external ? 'noopener noreferrer' : undefined"
            class="font-medium text-highlighted hover:text-primary"
          >{{ channel.text }}</a>
        </span>
      </li>
    </ul>

    <div
      v-if="settings?.address"
      class="flex items-start gap-3 text-sm"
    >
      <UIcon
        name="i-lucide-map-pin"
        class="mt-0.5 size-5 shrink-0 text-primary"
      />
      <span>
        <span class="block text-muted">Office</span>
        <span class="block whitespace-pre-line text-highlighted">{{ settings.address }}</span>
        <a
          v-if="settings.mapUrl"
          :href="settings.mapUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Open in Maps
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-4"
          />
        </a>
      </span>
    </div>

    <div
      v-if="hours.length"
      class="flex items-start gap-3 text-sm"
    >
      <UIcon
        name="i-lucide-clock"
        class="mt-0.5 size-5 shrink-0 text-primary"
      />
      <div>
        <p class="text-muted">
          Working hours<template v-if="settings?.timezone">
            ({{ settings.timezone.replace('_', ' ') }})
          </template>
        </p>
        <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-highlighted">
          <template
            v-for="line in hours"
            :key="line.days"
          >
            <dt>{{ line.days }}</dt>
            <dd class="tabular-nums">
              {{ line.hours }}
            </dd>
          </template>
        </dl>
      </div>
    </div>
  </address>
</template>
