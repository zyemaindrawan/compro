<template>
  <UApp :toaster="{ position: 'bottom-right' }">
    <div class="flex min-h-dvh flex-col bg-muted/40">
      <header class="flex items-center justify-between px-4 py-4 sm:px-6">
        <AppLogo />
        <ThemeToggle />
      </header>
      <main class="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div class="w-full max-w-sm">
          <slot />
        </div>
      </main>
    </div>
  </UApp>
</template>
