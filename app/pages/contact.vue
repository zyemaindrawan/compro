<script setup lang="ts">
import type { PublicForm } from '#shared/types/models'

const { data: form } = await useFetch<PublicForm>('/api/public/forms/contact', { key: 'form-contact' })

usePageSeo({
  title: 'Contact',
  description: 'Tell us what you want to build. We reply within one business day with questions or a next step.',
})

useSchemaOrg([defineWebPage({ '@type': 'ContactPage' })])
</script>

<template>
  <AppContainer class="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-20">
    <div class="space-y-10">
      <PageHeading
        title="Contact us"
        description="Tell us what you want to build and when you need it. We reply within one business day, usually with a few questions or a time to talk."
      />
      <ContactDetails />
      <p class="text-sm text-muted">
        Already know the scope?
        <NuxtLink
          to="/quote"
          class="font-medium text-primary hover:underline"
        >Request a quote</NuxtLink>
        and we will send an estimate.
      </p>
    </div>

    <div>
      <h2 class="sr-only">
        Send a message
      </h2>
      <LazyDynamicForm
        v-if="form"
        :form="form"
        hydrate-on-visible
      />
      <EmptyState
        v-else
        icon="i-lucide-mail"
        title="The form is unavailable right now"
        description="Email or WhatsApp us using the details on this page."
      />
    </div>
  </AppContainer>
</template>
