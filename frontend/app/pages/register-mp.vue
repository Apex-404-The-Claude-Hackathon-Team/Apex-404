<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { Landmark, AlertCircle, Eye, EyeOff, Cpu, CheckCircle } from '@lucide/vue'

definePageMeta({ layout: false })

const auth = useAuthStore()
const router = useRouter()
const errors = ref<string[]>([])
const loading = ref(false)
const showPassword = ref(false)

const { $api } = useNuxtApp() as any

// Fetch live constituencies on setup
const { data: constituenciesData } = await useAsyncData<any>('ghana-constituencies-mp-reg', () => {
    return $api('/api/location/constituencies')
})

const fallbackMps = [
    { id: 'suame', name: 'Suame', mpName: 'Osei Kyei-Mensah', region: 'Ashanti', party: 'NPP' },
    { id: 'north-tongu', name: 'North Tongu', mpName: 'Samuel Okudzeto Ablakwa', region: 'Volta', party: 'NDC' },
    { id: 'tamale-south', name: 'Tamale South', mpName: 'Haruna Iddrisu', region: 'Northern', party: 'NDC' }
]

const constituenciesList = computed(() => {
    return constituenciesData.value?.constituencies && constituenciesData.value.constituencies.length > 0
        ? constituenciesData.value.constituencies
        : fallbackMps
})

const getConstituencyLabel = (item: any) => {
    const mpName = item.mpName ? `Hon. ${item.mpName}` : 'Elected MP'
    return `${item.name} (${mpName})`
}

const form = ref({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    constituency: '',
    secretKey: ''
})

const selectedConstituency = computed(() =>
    constituenciesList.value.find((item: any) => item.id === form.value.constituency) ?? null
)

const isMinLength = computed(() => form.value.password.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(form.value.password))
const hasLowercase = computed(() => /[a-z]/.test(form.value.password))
const hasNumber = computed(() => /[0-9]/.test(form.value.password))
const showRequirements = computed(() => form.value.password.length > 0)

// Search & Dropdown State
const searchQuery = ref('')
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const filteredConstituencies = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) {
        return constituenciesList.value
    }
    return constituenciesList.value.filter((item: any) => {
        const nameMatch = item.name.toLowerCase().includes(query)
        const mpMatch = item.mpName ? item.mpName.toLowerCase().includes(query) : false
        const regionMatch = item.region ? item.region.toLowerCase().includes(query) : false
        return nameMatch || mpMatch || regionMatch
    })
})

const selectConstituency = (item: any) => {
    form.value.constituency = item.id
    searchQuery.value = getConstituencyLabel(item)
    showDropdown.value = false
}

// Watchers
watch(() => form.value.constituency, (newVal) => {
    const matched = constituenciesList.value.find((item: any) => item.id === newVal)
    if (matched) {
        searchQuery.value = getConstituencyLabel(matched)
    } else {
        searchQuery.value = ''
    }
}, { immediate: true })

watch(searchQuery, (newVal) => {
    if (!newVal.trim()) {
        form.value.constituency = ''
    }
})

// Click Away Handler
const handleDocumentClick = (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        showDropdown.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
})

const handleRegister = async () => {
    loading.value = true
    errors.value = []
    
    // Client-side password validation
    const pwd = form.value.password
    const localErrors: string[] = []
    if (pwd.length < 8) {
        localErrors.push('Password must be at least 8 characters.')
    }
    if (!/[A-Z]/.test(pwd)) {
        localErrors.push('Password must contain at least one uppercase letter.')
    }
    if (!/[a-z]/.test(pwd)) {
        localErrors.push('Password must contain at least one lowercase letter.')
    }
    if (!/[0-9]/.test(pwd)) {
        localErrors.push('Password must contain at least one number.')
    }
    
    if (localErrors.length > 0) {
        errors.value = localErrors
        loading.value = false
        return
    }
    
    try {
        const res = await $api('/api/auth/mp-register', {
            method: 'POST',
            body: {
                firstName: form.value.firstName,
                lastName: form.value.lastName,
                email: form.value.email,
                password: form.value.password,
                constituency: form.value.constituency,
                secretKey: form.value.secretKey
            }
        })
        
        // Save user session in auth store
        auth.token = res.accessToken
        auth.saveUserSession(res.user)
        
        router.push('/mp')
    } catch (err: any) {
        if (err.data?.errors && Array.isArray(err.data.errors)) {
            errors.value = err.data.errors.map((e: any) => e.msg)
        } else if (err.data?.message) {
            errors.value = [err.data.message]
        } else {
            errors.value = [err.message || 'MP Registration failed']
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
                      <span>GOVERNANCE NODE</span>
                      <div class="h-px bg-white/20 flex-1"></div>
                  </div>
              </div>

              <div class="relative z-10 space-y-4 max-w-lg">
                  <h2 class="text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white uppercase">
                      MP Cabinet<br/>
                      Registration.
                  </h2>
                  <p class="text-sm font-semibold text-slate-350 leading-relaxed">
                      Register your official constituency office node to coordinate directly with citizen complaints, publish statements, and manage development project milestones.
                  </p>
              </div>
          </div>

          <!-- RIGHT PANE: Clean register form -->
          <div class="w-full md:w-1/2 flex flex-col justify-center items-center overflow-y-auto px-6 py-8 md:px-12 lg:px-20 bg-white">
              <div class="w-full max-w-md space-y-4 text-left my-auto">
                  
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
                      <h2 class="text-3xl font-display font-bold text-slate-950 tracking-tight leading-none">Elected Representative Registration</h2>
                      <p class="text-xs text-slate-400 font-semibold mt-2">Connect your electoral office to the governance feed.</p>
                  </div>
                  
                  <div v-if="errors.length" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded text-xs font-semibold flex items-start gap-2">
                      <AlertCircle class="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <ul class="list-disc pl-4 space-y-0.5">
                          <li v-for="err in errors" :key="err">{{ err }}</li>
                      </ul>
                  </div>

                  <form @submit.prevent="handleRegister" class="space-y-3.5">
                      <div class="grid grid-cols-2 gap-4">
                          <div>
                              <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">First Name</label>
                              <input v-model="form.firstName" type="text" required placeholder="Osei" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                          </div>
                          <div>
                              <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Last Name</label>
                              <input v-model="form.lastName" type="text" required placeholder="Kyei-Mensah" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                          </div>
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Official Email</label>
                          <input v-model="form.email" type="email" required placeholder="mp.suame@parliament.gh" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div class="relative" ref="dropdownRef">
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Electoral Constituency</label>
                          <div class="relative">
                              <input 
                                v-model="searchQuery" 
                                @focus="showDropdown = true" 
                                type="text" 
                                placeholder="Search constituency, MP, or region..." 
                                class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors"
                              />
                              <!-- Hidden required input to preserve HTML5 form validation -->
                              <input 
                                type="hidden" 
                                v-model="form.constituency" 
                                required 
                              />
                          </div>
                          
                          <!-- Constituencies Filter Results Dropdown Overlay -->
                          <div v-if="showDropdown && filteredConstituencies.length > 0" class="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200/80 rounded-xl shadow-xl divide-y divide-slate-100">
                              <button 
                                v-for="item in filteredConstituencies" 
                                :key="item.id" 
                                type="button"
                                @click="selectConstituency(item)"
                                class="w-full text-left px-4 py-3 hover:bg-[#f8fafc] flex flex-col gap-0.5 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                  <span class="text-xs font-bold text-slate-900">{{ getConstituencyLabel(item) }}</span>
                                  <span class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{{ item.region }} Region &bull; {{ item.party }}</span>
                              </button>
                          </div>
                      </div>

                      <!-- Name match hint: shows expected MP name for selected constituency -->
                      <div v-if="selectedConstituency" class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                          <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
                          <div>
                              <p class="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Name Verification Required</p>
                              <p class="text-[10px] font-semibold text-amber-700">
                                  The official MP for <span class="font-black">{{ selectedConstituency.name }}</span> is
                                  <span class="font-black">{{ selectedConstituency.mpName }}</span>.
                                  Your first and last name must match this record exactly.
                              </p>
                          </div>
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Cabinet Verification Access Key</label>
                          <input v-model="form.secretKey" type="text" required placeholder="Enter MP Secret Key" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Create Access Password</label>
                          <div class="relative flex items-center bg-[#f4f5f8] rounded-xl border border-transparent focus-within:border-slate-350 transition-colors">
                              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required placeholder="Create a password" class="w-full bg-transparent px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none" />
                              <button @click="showPassword = !showPassword" type="button" class="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none border-none bg-transparent">
                                  <Eye v-if="!showPassword" class="w-4.5 h-4.5" />
                                  <EyeOff v-else class="w-4.5 h-4.5" />
                              </button>
                          </div>
                      </div>

                      <!-- Password requirements validation view list -->
                      <div v-if="showRequirements" class="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 mt-2 select-none animate-fade-in">
                          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2">Security Requirements</p>
                          <div class="grid grid-cols-2 gap-2">
                              <div class="flex items-center gap-2 text-[10px] font-semibold transition-colors" :class="isMinLength ? 'text-emerald-600' : 'text-slate-400'">
                                  <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border" :class="isMinLength ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200'">
                                      <span v-if="isMinLength" class="text-[8px] font-black">&checkmark;</span>
                                  </div>
                                  <span>At least 8 chars</span>
                              </div>
                              <div class="flex items-center gap-2 text-[10px] font-semibold transition-colors" :class="hasUppercase ? 'text-emerald-600' : 'text-slate-400'">
                                  <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border" :class="hasUppercase ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200'">
                                      <span v-if="hasUppercase" class="text-[8px] font-black">&checkmark;</span>
                                  </div>
                                  <span>One uppercase letter</span>
                              </div>
                              <div class="flex items-center gap-2 text-[10px] font-semibold transition-colors" :class="hasLowercase ? 'text-emerald-600' : 'text-slate-400'">
                                  <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border" :class="hasLowercase ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200'">
                                      <span v-if="hasLowercase" class="text-[8px] font-black">&checkmark;</span>
                                  </div>
                                  <span>One lowercase letter</span>
                              </div>
                              <div class="flex items-center gap-2 text-[10px] font-semibold transition-colors" :class="hasNumber ? 'text-emerald-600' : 'text-slate-400'">
                                  <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border" :class="hasNumber ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200'">
                                      <span v-if="hasNumber" class="text-[8px] font-black">&checkmark;</span>
                                  </div>
                                  <span>One numeric digit</span>
                              </div>
                          </div>
                      </div>

                      <div class="space-y-2.5 pt-2">
                          <button type="submit" :disabled="loading" class="w-full bg-[#080c14] hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-sm cursor-pointer disabled:opacity-50 border-none flex items-center justify-center gap-2">
                              <UiLoadingSpinner v-if="loading" size="xs" color="white" />
                              <span>{{ loading ? 'Establishing Cabinet Node...' : 'Register Official Node' }}</span>
                          </button>
                      </div>
                  </form>

                  <!-- Footer -->
                  <div class="text-center pt-2 border-t border-slate-100">
                      <p class="text-xs font-bold text-slate-450">
                          Already have an official node? 
                          <NuxtLink to="/login-mp" class="text-slate-900 hover:underline ml-1">Official Login</NuxtLink>
                      </p>
                  </div>

              </div>
          </div>
      </div>
  </div>
</template>
