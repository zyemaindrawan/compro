<template>
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 640 480"
    preserveAspectRatio="xMidYMid slice"
    class="hero-ornament pointer-events-none absolute inset-0 -z-10 size-full text-muted"
  >
    <defs>
      <pattern
        id="hero-dots"
        width="24"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <circle
          cx="1.5"
          cy="1.5"
          r="1.5"
          fill="currentColor"
          opacity="0.35"
        />
      </pattern>
    </defs>

    <rect
      width="640"
      height="480"
      fill="url(#hero-dots)"
    />

    <g
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      opacity="0.3"
    >
      <path d="M0 96 H180 L212 128 H360 L392 96 H640" />
      <path d="M96 0 V140 L124 168 V300 L96 328 V480" />
      <path d="M420 480 V360 L452 328 H560 L600 288 V180" />
      <path d="M0 384 H120 L152 352 H260" />
      <path d="M520 0 V60 L540 80 H640" />
    </g>

    <g
      fill="var(--ui-primary)"
      opacity="0.7"
    >
      <circle
        cx="212"
        cy="128"
        r="4"
      />
      <circle
        cx="392"
        cy="96"
        r="4"
      />
      <circle
        cx="124"
        cy="300"
        r="4"
      />
      <circle
        cx="452"
        cy="328"
        r="5"
      />
      <circle
        cx="600"
        cy="180"
        r="4"
      />
      <circle
        cx="260"
        cy="352"
        r="3"
      />
    </g>

    <rect
      x="418"
      y="150"
      width="168"
      height="112"
      rx="10"
      fill="var(--ui-bg)"
      stroke="currentColor"
      stroke-width="1"
      opacity="0.9"
    />
    <g
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      font-size="14"
      fill="currentColor"
    >
      <text
        x="438"
        y="182"
        opacity="0.55"
      >&lt;section&gt;</text>
      <text
        x="458"
        y="206"
        fill="var(--ui-primary)"
        opacity="0.9"
      >deploy()</text>
      <text
        x="458"
        y="230"
        opacity="0.55"
      >{ ok: true }</text>
      <text
        x="438"
        y="250"
        opacity="0.55"
      >&lt;/section&gt;</text>
    </g>

    <text
      x="36"
      y="440"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      font-size="18"
      fill="currentColor"
      opacity="0.4"
    >&lt;/&gt;</text>
  </svg>
</template>

<style scoped>
.hero-ornament {
  mask-image: linear-gradient(to bottom, black 55%, transparent);
}
</style>
