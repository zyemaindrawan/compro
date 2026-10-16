<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 -z-10 text-muted"
  >
    <svg
      focusable="false"
      class="cta-dots absolute inset-0 size-full"
    >
      <defs>
        <pattern
          id="cta-dots"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="1"
            cy="1"
            r="1"
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#cta-dots)"
        opacity="0.35"
      />
    </svg>

    <svg
      focusable="false"
      viewBox="0 0 300 200"
      class="absolute -end-10 -bottom-16 w-56 opacity-50 sm:-bottom-20 sm:w-72"
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      >
        <path d="M50 170 a50 50 0 0 1 8 -98 a78 78 0 0 1 146 -18 a58 58 0 0 1 18 116 Z" />
        <path
          d="M80 170 a32 32 0 0 1 6 -64 a50 50 0 0 1 96 -12 a38 38 0 0 1 12 76 Z"
          opacity="0.6"
        />
      </g>
      <g fill="var(--ui-primary)">
        <circle
          cx="58"
          cy="72"
          r="3"
        />
        <circle
          cx="204"
          cy="54"
          r="3"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.cta-dots {
  mask-image: linear-gradient(to right, transparent 30%, black 85%);
}
</style>
