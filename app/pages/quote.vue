<script setup lang="ts">
import type { PricingGroup, PublicForm } from '#shared/types/models'

const route = useRoute()
const queryValue = (key: string) => {
  const value = route.query[key]
  return typeof value === 'string' && /^[a-z0-9-]{1,80}$/.test(value) ? value : ''
}
const serviceSlug = queryValue('service')
const planSlug = queryValue('plan')

const [{ data: form }, { data: groups }] = await Promise.all([
  useFetch<PublicForm>('/api/public/forms/quotation', { key: 'form-quotation' }),
  useFetch<PricingGroup[]>('/api/public/pricing', { key: 'public-pricing', default: () => [], immediate: Boolean(planSlug) }),
])

const picked = computed(() => {
  const group = groups.value.find(entry => entry.service.slug === serviceSlug)
  const plan = group?.plans.find(entry => entry.slug === planSlug)
  return group && plan ? { service: group.service.name, plan: plan.name } : null
})

const prefill = computed(() => {
  const serviceField = form.value?.fields.find(field => field.name === 'service')
  const known = serviceField?.options.some(option => option.value === serviceSlug)
  return known ? { service: serviceSlug } : {}
})

usePageSeo({
  title: 'Request a quote',
  description: 'Describe the scope, timeline and budget. We send a written estimate within two business days.',
})

useSchemaOrg([defineWebPage()])
</script>

<template>
  <AppContainer class="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-20">
    <div class="space-y-8">
      <PageHeading
        title="Request a quote"
        description="Describe what you need, your timeline and a budget range. We reply within two business days with a written estimate or questions to close the gaps."
      />

      <div
        v-if="picked"
        class="flex items-start gap-3 rounded-lg border border-default bg-elevated/50 p-4 text-sm"
      >
        <UIcon
          name="i-lucide-tag"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />
        <p>
          <span class="block text-muted">You picked</span>
          <span class="font-medium text-highlighted">{{ picked.plan }} plan, {{ picked.service }}</span>
        </p>
      </div>

      <ol class="space-y-4 text-sm">
        <li class="flex gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-highlighted">1</span>
          <span class="text-muted"><span class="font-medium text-highlighted">We read the brief</span> and check scope against similar projects.</span>
        </li>
        <li class="flex gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-highlighted">2</span>
          <span class="text-muted"><span class="font-medium text-highlighted">A 30-minute call</span> if anything is unclear. Skipped when the brief is complete.</span>
        </li>
        <li class="flex gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-highlighted">3</span>
          <span class="text-muted"><span class="font-medium text-highlighted">A written estimate</span> with milestones, price in IDR and what is out of scope.</span>
        </li>
      </ol>
    </div>

    <div>
      <h2 class="sr-only">
        Project details
      </h2>
      <LazyDynamicForm
        v-if="form"
        :form="form"
        :prefill="prefill"
        :context="{ service: serviceSlug, plan: planSlug }"
        hydrate-on-visible
      />
      <EmptyState
        v-else
        icon="i-lucide-file-text"
        title="The form is unavailable right now"
        description="Email us your brief and we will reply within two business days."
      />
    </div>
  </AppContainer>
</template>
