<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'testimonials'>, data: BlockData }>()

const testimonials = computed(() => props.data.testimonials.slice(0, props.block.limit))
const featured = computed(() => testimonials.value[0])
const rest = computed(() => testimonials.value.slice(1))
</script>

<template>
  <section v-if="featured">
    <AppContainer class="grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
      <div class="space-y-10">
        <SectionHeader :heading="block.heading" />
        <TestimonialCard
          :testimonial="featured"
          featured
        />
      </div>
      <ul
        v-if="rest.length"
        class="space-y-6 lg:pt-4"
      >
        <li
          v-for="testimonial in rest"
          :key="testimonial.id"
          v-reveal
        >
          <TestimonialCard :testimonial="testimonial" />
        </li>
      </ul>
    </AppContainer>
  </section>
</template>
