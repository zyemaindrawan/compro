<script setup lang="ts">
const { settings, services } = useSiteSettings()

useSeoMeta({
  title: () => settings.value?.tagline || 'Home',
})
</script>

<template>
  <div>
    <section class="border-b border-default">
      <UContainer class="grid gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:items-end">
        <div class="space-y-6 lg:col-span-8">
          <p class="text-sm font-medium text-primary">
            {{ settings?.siteName }}
          </p>
          <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-6xl">
            {{ settings?.tagline }}
          </h1>
          <p
            v-if="settings?.description"
            class="max-w-2xl text-lg text-pretty text-muted"
          >
            {{ settings.description }}
          </p>
          <div class="flex flex-wrap gap-3">
            <UButton
              to="/quote"
              size="lg"
              label="Get a quote"
              trailing-icon="i-lucide-arrow-right"
            />
            <UButton
              to="/portfolio"
              size="lg"
              color="neutral"
              variant="outline"
              label="See our work"
            />
          </div>
        </div>
      </UContainer>
    </section>

    <section>
      <UContainer class="py-16 sm:py-24">
        <h2 class="sr-only">
          Services
        </h2>
        <ul class="grid border-default sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          <li
            v-for="(service, index) in services"
            :key="service.slug"
            class="border-default py-6 sm:px-6 first:sm:ps-0"
            :class="{ 'border-t sm:border-t-0': index > 0 }"
          >
            <NuxtLink
              :to="`/services/${service.slug}`"
              class="group block space-y-2"
            >
              <span class="font-mono text-xs text-dimmed">0{{ index + 1 }}</span>
              <p class="font-display text-xl font-semibold text-highlighted transition-colors group-hover:text-primary">
                {{ service.name }}
              </p>
            </NuxtLink>
          </li>
        </ul>
      </UContainer>
    </section>
  </div>
</template>
