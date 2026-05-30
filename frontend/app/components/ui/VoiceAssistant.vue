<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Volume2, VolumeX, Mic } from '@lucide/vue'

const route = useRoute()
const isSpeaking = ref(false)
const voiceSupported = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voiceSupported.value = true
  }
})

// Stop speaking if route changes
watch(() => route.path, () => {
  stopSpeech()
})

const getSpeechText = () => {
  const path = route.path
  if (path === '/') {
    return "Welcome to Voice Up. If you cannot read or write, do not worry. Click the big gold microphone button to report your problem by speaking. We will record your voice and write it down for your Member of Parliament. You can also click the other buttons to check local building projects or see rankings of government leaders."
  } else if (path === '/report') {
    return "This is the report page. To report a problem in your neighborhood, click the big microphone button in the middle of the screen. Speak clearly into your phone or computer. Tell us your name, where you are, and what is wrong. When you are finished, click the microphone button again. We will write down your words and send them to your representative."
  } else if (path === '/scorecards') {
    return "This is the ranking page. Here you can see how fast your local Member of Parliament fixes community problems. The higher the number out of one hundred, the better they are doing."
  } else if (path === '/projects') {
    return "This is the project tracker. Here you can see list of buildings, roads, and water wells that the government has promised to construct in your area, and whether they have finished them."
  } else if (path.startsWith('/reports/')) {
    return "This is the detail page for this report. You can see the description of the problem, its current status, and whether your local representative has posted a response statement."
  } else if (path === '/login' || path === '/register') {
    return "This is the registration page. You can log in or create a citizen account here. However, you do not need to register to submit a voice report. You can go back to the home page and report your issue directly."
  }
  return "You are browsing the Voice Up civic portal. Click the main navigation links to submit reports or view MP ratings."
}

const toggleSpeech = () => {
  if (!voiceSupported.value) return

  if (isSpeaking.value) {
    stopSpeech()
  } else {
    startSpeech()
  }
}

const startSpeech = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel() // Stop any ongoing speech
  
  const text = getSpeechText()
  const utterance = new SpeechSynthesisUtterance(text)
  
  // Try to find a clear English voice
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(v => v.lang.includes('en-'))
  if (englishVoice) {
    utterance.voice = englishVoice
  }
  
  utterance.rate = 0.85 // Slower speed for clear understanding
  
  utterance.onend = () => {
    isSpeaking.value = false
  }
  
  utterance.onerror = () => {
    isSpeaking.value = false
  }
  
  isSpeaking.value = true
  window.speechSynthesis.speak(utterance)
}

const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
}

onBeforeUnmount(() => {
  stopSpeech()
})
</script>

<template>
  <div v-if="voiceSupported" class="fixed bottom-6 right-6 z-50">
    <button 
      @click="toggleSpeech" 
      :class="isSpeaking ? 'bg-civic-gold border-civic-gold text-civic-navy-dark shadow-[0_0_20px_rgba(197,160,89,0.4)] animate-pulse scale-105' : 'bg-[#0c1220] border-white/10 text-white hover:bg-slate-900 shadow-xl'"
      class="w-14 h-14 rounded-full flex items-center justify-center border cursor-pointer transition-all hover:scale-105"
      title="Voice Guide"
    >
      <div v-if="isSpeaking" class="flex flex-col items-center justify-center">
        <VolumeX class="w-6 h-6" />
        <span class="text-[7px] font-black uppercase tracking-wider leading-none mt-1">Stop</span>
      </div>
      <div v-else class="flex flex-col items-center justify-center">
        <Volume2 class="w-6 h-6 text-civic-gold animate-bounce" />
        <span class="text-[7px] font-black uppercase tracking-wider leading-none mt-1">Listen</span>
      </div>
    </button>
  </div>
</template>
