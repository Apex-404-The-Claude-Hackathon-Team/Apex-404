<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { Landmark, AlertCircle, Eye, EyeOff, Cpu } from '@lucide/vue'

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
        await auth.login({
            email: form.value.email,
            password: form.value.password
        })
        router.push('/')
    } catch (err: any) {
        errors.value = [err.message || 'Login failed']
    } finally {
        loading.value = false
    }
}

const quickLogin = async (email: string) => {
    form.value.email = email
    form.value.password = 'demoPassword123'
    await handleLogin()
}
</script>

<template>
  <div class="w-full h-screen bg-[#f8fafc] flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans overflow-hidden">
      <div class="w-full h-full max-w-7xl bg-white rounded-none md:rounded-3xl shadow-xl border border-slate-200/50 flex items-stretch overflow-hidden animate-scale-in">
          
          <!-- LEFT PANE: Premium government/civic image card (Hidden on mobile) -->
          <div class="hidden md:flex md:w-1/2 p-16 flex-col justify-between relative overflow-hidden text-white bg-slate-950 select-none">
              <!-- Fluid Backdrop Image -->
              <div class="absolute inset-0 bg-cover bg-center opacity-85 transition-opacity hover:opacity-95 duration-500" style="background-image: url('https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80')"></div>
              <!-- Dark Overlay to ensure readability -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 z-0"></div>

              <div class="relative z-10 flex flex-col gap-2">
                  <div class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-350 flex items-center gap-4">
                      <span>CITIZEN CHARTER</span>
                      <div class="h-px bg-white/20 flex-1"></div>
                  </div>
              </div>

              <div class="relative z-10 space-y-4 max-w-lg">
                  <h2 class="text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white uppercase">
                      Speak to Report.<br/>
                      Track progress.
                  </h2>
                  <p class="text-sm font-semibold text-slate-300 leading-relaxed">
                      Hold leadership accountable, review budgets in real-time, and voice your community's development concerns instantly.
                  </p>
              </div>
          </div>

          <!-- RIGHT PANE: Clean login form -->
          <div class="w-full md:w-1/2 flex flex-col justify-center items-center overflow-y-auto px-6 py-8 md:px-12 lg:px-20 bg-white">
              <div class="w-full max-w-md space-y-6 text-left my-auto">
                  
                  <!-- Top Logo -->
                  <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded bg-slate-900 flex items-center justify-center p-1.5 shadow">
                          <Cpu class="w-4 h-4 text-civic-gold" />
                      </div>
                      <span class="text-sm font-display font-black tracking-tight text-slate-900 leading-none">Voice<span class="text-civic-gold">Up</span></span>
                  </div>

                  <!-- Header -->
                  <div>
                      <h2 class="text-3xl font-display font-bold text-slate-950 tracking-tight leading-none">Welcome Back</h2>
                      <p class="text-xs text-slate-400 font-semibold mt-2">Enter your email and password to access your account</p>
                  </div>
                  
                  <div v-if="errors.length" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded text-xs font-semibold flex items-start gap-2">
                      <AlertCircle class="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <ul class="list-disc pl-4 space-y-0.5">
                          <li v-for="err in errors" :key="err">{{ err }}</li>
                      </ul>
                  </div>

                  <form @submit.prevent="handleLogin" class="space-y-4">
                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1.5">Email</label>
                          <input v-model="form.email" type="email" required placeholder="Enter your email" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1.5">Password</label>
                          <div class="relative flex items-center bg-[#f4f5f8] rounded-xl border border-transparent focus-within:border-slate-350 transition-colors">
                              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required placeholder="Enter your password" class="w-full bg-transparent px-4 py-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none" />
                              <button @click="showPassword = !showPassword" type="button" class="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none border-none bg-transparent">
                                  <Eye v-if="!showPassword" class="w-4.5 h-4.5" />
                                  <EyeOff v-else class="w-4.5 h-4.5" />
                              </button>
                          </div>
                      </div>

                      <div class="flex items-center justify-between text-[10px] font-bold">
                          <label class="flex items-center gap-2 text-slate-500 cursor-pointer">
                              <input type="checkbox" class="rounded border-slate-300 text-black focus:ring-black" />
                              <span>Remember me</span>
                          </label>
                          <a href="#" class="text-slate-500 hover:text-black">Forgot Password</a>
                      </div>

                      <div class="space-y-2.5 pt-1">
                          <button type="submit" :disabled="loading" class="w-full bg-black hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-sm cursor-pointer disabled:opacity-50 border-none flex items-center justify-center gap-2">
                              <UiLoadingSpinner v-if="loading" size="xs" color="white" />
                              <span>{{ loading ? 'Signing In...' : 'Sign In' }}</span>
                          </button>
                      </div>
                  </form>

                  <!-- Demo Accounts Quick Bypass -->
                  <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Demo Quick Login Bypasses</span>
                      <div class="grid grid-cols-2 gap-2">
                          <button @click="quickLogin('citizen@voiceup.gh')" type="button" class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold py-2 rounded uppercase tracking-wider transition-colors cursor-pointer text-center">
                              Citizen Account
                          </button>
                          <button @click="quickLogin('mp@voiceup.gh')" type="button" class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold py-2 rounded uppercase tracking-wider transition-colors cursor-pointer text-center">
                              MP Admin Console
                          </button>
                      </div>
                  </div>

                  <!-- Footer -->
                  <div class="text-center pt-2">
                      <p class="text-xs font-bold text-slate-400">
                          Don't have an account? 
                          <NuxtLink to="/register" class="text-slate-900 hover:underline ml-1">Sign Up</NuxtLink>
                      </p>
                  </div>

              </div>
          </div>
      </div>
  </div>
</template>