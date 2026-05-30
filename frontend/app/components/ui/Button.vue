<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (val: string) => ['primary', 'secondary', 'accent', 'outline', 'ghost'].includes(val)
  },
  size: {
    type: String,
    default: 'md',
    validator: (val: string) => ['sm', 'md', 'lg'].includes(val)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button'
  }
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-bold tracking-wider uppercase transition-colors rounded-none outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-civic-navy text-white hover:bg-civic-navy-dark focus:ring-civic-navy',
    secondary: 'bg-civic-blue text-white hover:bg-civic-blue-hover focus:ring-civic-blue',
    accent: 'bg-civic-gold text-civic-navy-dark hover:bg-civic-gold-hover focus:ring-civic-gold',
    outline: 'border-2 border-civic-navy text-civic-navy hover:bg-civic-light focus:ring-civic-navy',
    ghost: 'text-civic-navy hover:bg-civic-light focus:ring-civic-navy'
  }
  
  const sizes = {
    sm: 'text-xs py-2 px-4',
    md: 'text-sm py-3 px-6',
    lg: 'text-base py-4 px-8'
  }

  return `${base} ${variants[props.variant as keyof typeof variants]} ${sizes[props.size as keyof typeof sizes]}`
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="buttonClasses">
    <slot />
  </button>
</template>
