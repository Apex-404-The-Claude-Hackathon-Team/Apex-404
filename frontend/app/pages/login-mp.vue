<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { AlertCircle, Eye, EyeOff, Cpu, Landmark, ShieldCheck } from '@lucide/vue'

definePageMeta({ layout: false })

const auth = useAuthStore()
const router = useRouter()
const errors = ref<string[]>([])
const loading = ref(false)

const showPassword = ref(false)

const form = ref({
    email: '',
    password: ''
})

const handleLogin = async () => {
    loading.value = true
    errors.value = []
    
    try {
        const { $api } = useNuxtApp() as any
        const res = await $api('/api/auth/mp-login', {
            method: 'POST',
            body: {
                email: form.value.email,
                password: form.value.password
            }
        })
        
        // Save user session in auth store
        auth.token = res.accessToken
        auth.saveUserSession(res.user)
        
        router.push('/mp')
    } catch (err: any) {
        if (err.data?.message) {
            errors.value = [err.data.message]
        } else {
            errors.value = [err.message || 'Authentication failed']
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="w-full h-screen bg-[#f8fafc] flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans overflow-hidden">
      <div class="w-full h-full max-w-7xl bg-white rounded-none md:rounded-3xl shadow-xl border border-slate-200/50 flex items-stretch overflow-hidden animate-scale-in">
          
          <!-- LEFT PANE: Premium government/civic image card (Hidden on mobile) -->
          <div class="hidden md:flex md:w-1/2 p-16 flex-col justify-between relative overflow-hidden text-white bg-slate-950 select-none">
              <!-- Fluid Backdrop Image -->
              <div class="absolute inset-0 bg-cover bg-center opacity-85 transition-opacity hover:opacity-95 duration-500" style="background-image: url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80')"></div>
              <!-- Dark Overlay to ensure readability -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 z-0"></div>

              <div class="relative z-10 flex flex-col gap-2">
                  <div class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-350 flex items-center gap-4">
                      <span>OFFICIAL ACCESS</span>
                      <div class="h-px bg-white/20 flex-1"></div>
                  </div>
              </div>

              <div class="relative z-10 space-y-4 max-w-lg">
                  <h2 class="text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white uppercase">
                      MP Official<br/>
                      Cabinet Console.
                  </h2>
                  <p class="text-sm font-semibold text-slate-350 leading-relaxed">
                      Publish response statements, update constituency project trackers, and access AI aggregate intelligence briefings for your district.
                  </p>
              </div>
          </div>

          <!-- RIGHT PANE: Clean login form -->
          <div class="w-full md:w-1/2 flex flex-col justify-center items-center overflow-y-auto px-6 py-8 md:px-12 lg:px-20 bg-white">
              <div class="w-full max-w-md space-y-6 text-left my-auto">
                  
                  <!-- Top Logo -->
                  <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                          <div class="w-8 h-8 rounded bg-slate-900 flex items-center justify-center p-1.5 shadow">
                              <Cpu class="w-4 h-4 text-civic-gold" />
                          </div>
                          <span class="text-sm font-display font-black tracking-tight text-slate-900 leading-none">Voice<span class="text-civic-gold">Up</span></span>
                      </div>
                      <span class="text-[8px] bg-amber-50 text-amber-600 border border-amber-200 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          Elected Official Portal
                      </span>
                  </div>

                  <!-- Header -->
                  <div>
                      <h2 class="text-3xl font-display font-bold text-slate-950 tracking-tight leading-none">Representative Login</h2>
                      <p class="text-xs text-slate-400 font-semibold mt-2">Access your constituency node console with your credentials.</p>
                  </div>
                  
                  <div v-if="errors.length" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded text-xs font-semibold flex items-start gap-2">
                      <AlertCircle class="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <ul class="list-disc pl-4 space-y-0.5">
                          <li v-for="err in errors" :key="err">{{ err }}</li>
                      </ul>
                  </div>

                  <form @submit.prevent="handleLogin" class="space-y-4">
                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1.5">Official Email</label>
                          <input v-model="form.email" type="email" required placeholder="e.g. mp@parliament.gh" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1.5">Console Key / Password</label>
                          <div class="relative flex items-center bg-[#f4f5f8] rounded-xl border border-transparent focus-within:border-slate-350 transition-colors">
                              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required placeholder="Enter password key" class="w-full bg-transparent px-4 py-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none" />
                              <button @click="showPassword = !showPassword" type="button" class="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none border-none bg-transparent">
                                  <Eye v-if="!showPassword" class="w-4.5 h-4.5" />
                                  <EyeOff v-else class="w-4.5 h-4.5" />
                              </button>
                          </div>
                      </div>

                      <div class="space-y-2.5 pt-2">
                          <button type="submit" :disabled="loading" class="w-full bg-[#080c14] hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-sm cursor-pointer disabled:opacity-50 border-none flex items-center justify-center gap-2">
                              <UiLoadingSpinner v-if="loading" size="xs" color="white" />
                              <span>{{ loading ? 'Securing Console Connection...' : 'Establish Connection' }}</span>
                          </button>
                      </div>
                  </form>

                  <!-- Footer -->
                  <div class="text-center pt-2 border-t border-slate-100 space-y-2">
                      <p class="text-xs font-bold text-slate-450">
                          Need an official node? 
                          <NuxtLink to="/register-mp" class="text-slate-900 hover:underline ml-1">Register Official Node</NuxtLink>
                      </p>
                      <p class="text-xs font-bold text-slate-450">
                          Are you a regular citizen? 
                          <NuxtLink to="/login" class="text-slate-900 hover:underline ml-1">Go to Citizen Portal</NuxtLink>
                      </p>
                  </div>

              </div>
          </div>
      </div>
  </div>
</template>
