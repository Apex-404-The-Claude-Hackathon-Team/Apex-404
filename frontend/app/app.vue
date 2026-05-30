<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Landmark } from '@lucide/vue'

const isInitialLoading = ref(true)

onMounted(() => {
  // Premium entry delay to let layout elements settle and hydrate
  setTimeout(() => {
    isInitialLoading.value = false
  }, 1000)
})
</script>

<template>
  <div>
    <!-- Render main layouts and pages normally so hydration is not interrupted -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Initial Loading Screen (Absolute overlay covering the viewport) -->
    <Transition name="fade-screen">
      <div v-if="isInitialLoading" class="fixed inset-0 z-[9999] bg-[#0c1220] flex flex-col items-center justify-center text-white select-none">
        <!-- Glowing mesh elements -->
        <div class="absolute top-[20%] left-[20%] w-[380px] h-[380px] bg-civic-blue/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse z-0"></div>
        <div class="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-civic-gold/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        <div class="relative flex flex-col items-center text-center space-y-6 max-w-sm px-6 z-10">
          <!-- Logo Widget -->
          <div class="flex items-center gap-2 mb-2">
            <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-2xl">
              <Landmark class="w-6 h-6 text-civic-gold animate-pulse" />
            </div>
            <span class="text-xl font-display font-black tracking-tight text-white leading-none">Voice<span class="text-civic-gold">Up</span></span>
          </div>

          <!-- Spinner (Consistent design) -->
          <UiLoadingSpinner size="lg" color="gold" />

          <!-- Loading details -->
          <div class="space-y-1.5 pt-4">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Initializing Portal</h3>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Securing Constituency Telemetry...</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-screen-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-screen-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
