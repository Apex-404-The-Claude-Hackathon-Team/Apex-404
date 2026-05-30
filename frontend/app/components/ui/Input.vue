<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="block text-xs font-bold text-civic-navy uppercase tracking-wider">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <div v-if="$slots.icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <slot name="icon" />
      </div>
      <input
        :type="type"
        :value="modelValue"
        @input="onInput"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="[
          'w-full bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-civic-blue focus:ring-1 focus:ring-civic-blue transition-colors rounded-none placeholder:text-slate-400',
          $slots.icon ? 'pl-10 py-3 pr-4' : 'px-4 py-3',
          disabled ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''
        ]"
      />
    </div>
  </div>
</template>
