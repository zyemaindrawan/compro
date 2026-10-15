<script setup lang="ts">
import type { ArticleAuthor } from '#shared/types/models'

const props = defineProps<{ author: ArticleAuthor }>()

const initials = computed(() => props.author.displayName.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join(''))
</script>

<template>
  <aside
    class="flex gap-4 rounded-lg border border-default p-5"
    aria-label="About the author"
  >
    <SmartImage
      v-if="author.avatar"
      :media="author.avatar"
      :alt="author.displayName"
      sizes="40px"
      class="size-10 shrink-0 rounded-full object-cover"
    />
    <span
      v-else
      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-elevated text-xl text-highlighted"
      aria-hidden="true"
    >{{ initials }}</span>
    <div class="space-y-1">
      <p class="text-xs text-muted">
        Written by
      </p>
      <p class="font-semibold text-highlighted">
        {{ author.displayName }}
      </p>
      <p
        v-if="author.bio"
        class="text-sm text-muted"
      >
        {{ author.bio }}
      </p>
    </div>
  </aside>
</template>
