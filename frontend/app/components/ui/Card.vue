<script setup lang="ts">
// Simple Civic-styled Card component
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  flush: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="bg-white border-t-4 border-civic-navy shadow-civic">
    <div v-if="title || $slots.header" :class="['border-b border-slate-100 flex items-center justify-between', flush ? 'p-0' : 'px-6 py-4']">
      <div>
        <h3 v-if="title" class="font-display font-black text-civic-navy text-lg leading-tight uppercase tracking-tight">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs font-bold text-civic-gold uppercase tracking-widest mt-1">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </div>
    
    <div :class="flush ? 'p-0' : 'p-6'">
      <slot />
    </div>
    
    <div v-if="$slots.footer" :class="['bg-slate-50 border-t border-slate-100', flush ? 'p-0' : 'px-6 py-3']">
      <slot name="footer" />
    </div>
  </div>
</template>
