<template>
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 400 240"
    class="cloud-ornament pointer-events-none absolute end-0 -bottom-8 -z-10 w-56 text-muted sm:top-1/2 sm:bottom-auto sm:w-96 sm:-translate-y-1/2"
  >
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="1"
    >
      <path d="M100 200 a60 60 0 0 1 10 -118 a90 90 0 0 1 170 -20 a70 70 0 0 1 20 138 Z" />
      <path
        d="M130 200 a40 40 0 0 1 8 -80 a62 62 0 0 1 118 -14 a48 48 0 0 1 14 94 Z"
        opacity="0.6"
      />
      <path
        d="M0 200 H400"
        stroke-dasharray="2 6"
        opacity="0.5"
      />
    </g>
    <g fill="var(--ui-primary)">
      <circle
        cx="110"
        cy="82"
        r="3"
      />
      <circle
        cx="280"
        cy="62"
        r="3"
      />
      <circle
        cx="300"
        cy="200"
        r="3"
      />
    </g>
  </svg>
</template>

<style scoped>
.cloud-ornament {
  opacity: 0.22;
}
</style>
