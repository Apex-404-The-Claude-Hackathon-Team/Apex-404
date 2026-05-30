<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    color?: 'blue' | 'gold' | 'white' | 'slate'
  }>(),
  {
    size: 'md',
    color: 'blue'
  }
)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-4 h-4 border-[1.5px]'
    case 'sm': return 'w-6 h-6 border-2'
    case 'md': return 'w-10 h-10 border-2'
    case 'lg': return 'w-16 h-16 border-[3px]'
    case 'xl': return 'w-20 h-20 border-[4px]'
    default: return 'w-10 h-10 border-2'
  }
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'blue': return 'border-slate-200/60 border-t-civic-blue'
    case 'gold': return 'border-slate-200/60 border-t-civic-gold'
    case 'white': return 'border-white/20 border-t-white'
    case 'slate': return 'border-slate-200 border-t-slate-600'
    default: return 'border-slate-200/60 border-t-civic-blue'
  }
})
</script>

<template>
  <div class="relative flex items-center justify-center shrink-0">
    <div :class="[sizeClasses, colorClasses]" class="rounded-full animate-spin"></div>
  </div>
</template>
