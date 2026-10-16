<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-default focus:px-3 focus:py-2"
    >
      Skip to content
    </a>
    <SiteHeader />
    <RouteLoading />
    <main
      id="main"
      class="flex-1"
    >
      <slot />
    </main>
    <LazySiteFooter hydrate-on-visible />
  </div>
</template>
