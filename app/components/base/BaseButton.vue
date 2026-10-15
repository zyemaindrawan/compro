<script setup lang="ts">
type Color = 'primary' | 'neutral'
type Variant = 'solid' | 'outline' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  to?: string | { path: string, query?: Record<string, string | undefined> }
  label?: string
  icon?: string
  trailingIcon?: string
  color?: Color
  variant?: Variant
  size?: Size
  block?: boolean
  square?: boolean
  type?: 'button' | 'submit'
  target?: string
  rel?: string
}>(), {
  to: undefined,
  label: undefined,
  icon: undefined,
  trailingIcon: undefined,
  color: 'primary',
  variant: 'solid',
  size: 'md',
  block: false,
  square: false,
  type: 'button',
  target: undefined,
  rel: undefined,
})

const TONES: Record<Variant, Record<Color, string>> = {
  solid: {
    primary: 'text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 outline-primary/25',
    neutral: 'text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 outline-inverted/25',
  },
  outline: {
    primary: 'ring ring-inset ring-primary/50 text-primary hover:bg-primary/10 active:bg-primary/10 outline-primary/25 focus-visible:ring-primary',
    neutral: 'ring ring-inset ring-accented text-default bg-default hover:bg-elevated active:bg-elevated outline-inverted/25 focus-visible:ring-inverted',
  },
  ghost: {
    primary: 'text-primary hover:bg-primary/10 active:bg-primary/10 outline-primary/25',
    neutral: 'text-default hover:bg-elevated active:bg-elevated outline-inverted/25',
  },
  link: {
    primary: 'text-primary hover:text-primary/75 active:text-primary/75 outline-primary/25',
    neutral: 'text-muted hover:text-default active:text-default outline-inverted/25',
  },
}

const SIZES: Record<Size, { text: string, padding: string, square: string, icon: string }> = {
  sm: { text: 'text-xs gap-1.5', padding: 'px-2.5 py-1.5', square: 'p-1.5', icon: 'size-4' },
  md: { text: 'text-sm gap-1.5', padding: 'px-2.5 py-1.5', square: 'p-1.5', icon: 'size-5' },
  lg: { text: 'text-sm gap-2', padding: 'px-3 py-2', square: 'p-2', icon: 'size-5' },
}

const size = computed(() => SIZES[props.size])
const slots = useSlots()
const isSquare = computed(() => props.square || (!props.label && !slots.default))

const padding = computed(() => {
  if (props.variant === 'link') return 'py-1.5'
  return isSquare.value ? size.value.square : size.value.padding
})

const classes = computed(() => [
  'inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-3 disabled:cursor-not-allowed disabled:opacity-75',
  size.value.text,
  padding.value,
  TONES[props.variant][props.color],
  props.block ? 'w-full justify-center' : '',
])
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :target="target"
    :rel="rel"
    :class="classes"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      :class="['shrink-0', size.icon]"
    />
    <slot>
      <span
        v-if="label"
        class="truncate"
      >{{ label }}</span>
    </slot>
    <UIcon
      v-if="trailingIcon"
      :name="trailingIcon"
      :class="['shrink-0', size.icon, block ? 'ms-auto' : '']"
    />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="classes"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      :class="['shrink-0', size.icon]"
    />
    <slot>
      <span
        v-if="label"
        class="truncate"
      >{{ label }}</span>
    </slot>
    <UIcon
      v-if="trailingIcon"
      :name="trailingIcon"
      :class="['shrink-0', size.icon, block ? 'ms-auto' : '']"
    />
  </button>
</template>
