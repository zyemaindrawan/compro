<script setup lang="ts">
import type { Testimonial } from '#shared/types/models'

const props = withDefaults(defineProps<{
  testimonial: Testimonial
  featured?: boolean
}>(), {
  featured: false,
})

const initials = computed(() => props.testimonial.authorName
  .split(/\s+/)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join(''))

const byline = computed(() => [props.testimonial.authorRole, props.testimonial.company].filter(Boolean).join(', '))
</script>

<template>
  <figure
    class="flex flex-col gap-6"
    :class="featured ? 'border-s-2 border-primary ps-6 sm:ps-8' : 'h-full justify-between rounded-lg border border-default bg-default p-6'"
  >
    <div class="space-y-4">
      <p
        v-if="testimonial.rating"
        class="flex gap-0.5 text-primary"
      >
        <UIcon
          v-for="star in testimonial.rating"
          :key="star"
          name="i-lucide-star"
          class="size-4"
          aria-hidden="true"
        />
        <span class="sr-only">Rated {{ testimonial.rating }} out of 5</span>
      </p>
      <blockquote
        class="text-pretty text-highlighted"
        :class="featured ? 'font-display text-2xl leading-snug font-semibold sm:text-3xl' : ''"
      >
        <p>“{{ testimonial.quote }}”</p>
      </blockquote>
    </div>
    <figcaption class="flex items-center gap-3">
      <SmartImage
        v-if="testimonial.avatar"
        :media="testimonial.avatar"
        :alt="testimonial.avatar.alt || testimonial.authorName"
        sizes="40px"
        class="size-10 rounded-full object-cover"
      />
      <span
        v-else
        class="flex size-10 items-center justify-center rounded-full bg-elevated text-sm font-semibold text-default"
        aria-hidden="true"
      >{{ initials }}</span>
      <span class="min-w-0 text-sm">
        <span class="block font-medium text-highlighted">{{ testimonial.authorName }}</span>
        <span
          v-if="byline"
          class="block text-muted"
        >{{ byline }}</span>
      </span>
    </figcaption>
  </figure>
</template>
