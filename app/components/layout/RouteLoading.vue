<script setup lang="ts">
// Client-side navigations only: nothing renders during SSR, and navigations faster than the throttle show nothing.
const { isLoading } = useLoadingIndicator({ throttle: 200, hideDelay: 120 })
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLoading"
      role="status"
      class="pointer-events-none fixed top-[calc(var(--ui-header-height)+0.75rem)] left-1/2 z-50 flex -translate-x-1/2 items-center rounded-full border border-default bg-default/90 p-2 shadow-sm shadow-black/10"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-4 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span class="sr-only">Loading page</span>
    </div>
  </Transition>
</template>
