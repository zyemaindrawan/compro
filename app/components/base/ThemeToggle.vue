<script setup lang="ts">
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <BaseButton
    color="neutral"
    variant="ghost"
    square
    aria-label="Toggle dark mode"
    @click="toggle"
  >
    <UIcon
      name="i-lucide-sun"
      class="size-5 dark:hidden"
    />
    <UIcon
      name="i-lucide-moon"
      class="hidden size-5 dark:block"
    />
  </BaseButton>
</template>
