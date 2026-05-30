<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { Landmark, AlertCircle, Eye, EyeOff, Cpu, MapPin, CheckCircle } from '@lucide/vue'

definePageMeta({ layout: false })

const auth = useAuthStore()
const router = useRouter()
const errors = ref<string[]>([])
const loading = ref(false)
const showPassword = ref(false)

const { $api } = useNuxtApp() as any

// Fetch live constituencies on setup
const { data: constituenciesData } = await useAsyncData<any>('ghana-constituencies', () => {
    return $api('/api/location/constituencies')
})

const fallbackMps = [
    { id: 'suame', name: 'Suame', mpName: 'Osei Kyei-Mensah', region: 'Ashanti', party: 'NPP' },
    { id: 'north-tongu', name: 'North Tongu', mpName: 'Samuel Okudzeto Ablakwa', region: 'Volta', party: 'NDC' },
    { id: 'tamale-south', name: 'Tamale South', mpName: 'Haruna Iddrisu', region: 'Northern', party: 'NDC' }
]

const constituenciesList = computed(() => {
    const raw = constituenciesData.value?.constituencies?.length
        ? constituenciesData.value.constituencies
        : fallbackMps
    return [...raw].sort((a: any, b: any) => a.name.localeCompare(b.name))
})

const getConstituencyLabel = (item: any) => {
    const mpName = item.mpName ? `Hon. ${item.mpName}` : 'Elected MP'
    return `${item.name} (${mpName})`
}

const form = ref({
    fullName: '',
    email: '',
    password: '',
    constituency: ''
})

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

// Click Away Handler — clear typed text if no valid selection was made
const handleDocumentClick = (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        showDropdown.value = false
        if (!form.value.constituency) {
            searchQuery.value = ''
        }
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
        await auth.register({
            fullName: form.value.fullName,
            email: form.value.email,
            password: form.value.password,
            constituency: form.value.constituency
        })
        router.push('/')
    } catch (err: any) {
        if (err.data?.errors && Array.isArray(err.data.errors)) {
            errors.value = err.data.errors.map((e: any) => e.msg)
        } else if (err.data?.message) {
            errors.value = [err.data.message]
        } else {
            errors.value = [err.message || 'Registration failed']
        }
    } finally {
        loading.value = false
    }
}

const locating = ref(false)
const locationFeedback = ref('')

const useCurrentLocation = () => {
    if (!navigator.geolocation) {
        errors.value = ['Geolocation is not supported by your browser.']
        return
    }
    
    locating.value = true
    errors.value = []
    locationFeedback.value = ''
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords
            try {
                const { $api } = useNuxtApp() as any
                // Query backend reverse-geocode to see address details
                const data = await $api(`/api/location/reverse-geocode`, {
                    query: { lat: latitude, lng: longitude }
                })
                
                let bestMatch = null
                const addressStr = (data?.location?.address || '').toLowerCase()
                
                // 1. First scan for a text match in the reverse-geocoded address
                for (const item of constituenciesList.value) {
                    const cName = item.name.toLowerCase()
                    if (addressStr.includes(cName) || addressStr.includes(cName.replace('-', ' '))) {
                        bestMatch = item.id
                        break
                    }
                }
                
                // 2. If no text match, fall back to coordinate distance matching
                if (!bestMatch) {
                    const activeIds = constituenciesList.value.map((item: any) => item.id)
                    const MP_COORDS = {
                        mp_1: { lat: 6.715, lng: -1.619, name: 'Suame' },
                        mp_2: { lat: 6.060, lng: 0.428, name: 'North Tongu' },
                        mp_3: { lat: 9.378, lng: -0.840, name: 'Tamale South' }
                    }
                    
                    let minDistance = Infinity
                    bestMatch = activeIds[0] || 'mp_1'
                    
                    for (const [id, coord] of Object.entries(MP_COORDS)) {
                        if (!activeIds.includes(id)) continue
                        const dx = longitude - coord.lng
                        const dy = latitude - coord.lat
                        const dist = dx * dx + dy * dy
                        if (dist < minDistance) {
                            minDistance = dist
                            bestMatch = id
                        }
                    }
                }
                
                form.value.constituency = bestMatch
                const matchName = constituenciesList.value.find((item: any) => item.id === bestMatch)?.name || bestMatch
                
                locationFeedback.value = `Successfully detected location. Matched to ${matchName} constituency.`
                setTimeout(() => { locationFeedback.value = '' }, 5000)
            } catch (err: any) {
                console.error('Error reverse geocoding:', err)
                const activeIds = constituenciesList.value.map((item: any) => item.id)
                const MP_COORDS = {
                    mp_1: { lat: 6.715, lng: -1.619 },
                    mp_2: { lat: 6.060, lng: 0.428 },
                    mp_3: { lat: 9.378, lng: -0.840 }
                }
                let bestMatch = activeIds[0] || 'mp_1'
                let minDistance = Infinity
                for (const [id, coord] of Object.entries(MP_COORDS)) {
                    if (!activeIds.includes(id)) continue
                    const dx = longitude - coord.lng
                    const dy = latitude - coord.lat
                    const dist = dx * dx + dy * dy
                    if (dist < minDistance) {
                        minDistance = dist
                        bestMatch = id
                    }
                }
                form.value.constituency = bestMatch
                const matchName = constituenciesList.value.find((item: any) => item.id === bestMatch)?.name || bestMatch
                locationFeedback.value = `Matched to nearest constituency (${matchName}) via GPS coordinates.`
                setTimeout(() => { locationFeedback.value = '' }, 5000)
            } finally {
                locating.value = false
            }
        },
        (error) => {
            console.error('Geolocation error:', error)
            errors.value = [`Could not retrieve GPS location: ${error.message}`]
            locating.value = false
        },
        { enableHighAccuracy: true, timeout: 8000 }
    )
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
                      <span>CIVIC CHARTER</span>
                      <div class="h-px bg-white/20 flex-1"></div>
                  </div>
              </div>

              <div class="relative z-10 space-y-4 max-w-lg">
                  <h2 class="text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white uppercase">
                      Hold Leadership<br/>
                      Accountable.
                  </h2>
                  <p class="text-sm font-semibold text-slate-300 leading-relaxed">
                      Ensure your voice is counted in local development audits. Register to contribute reports and track constituency progress in real-time.
                  </p>
              </div>
          </div>

          <!-- RIGHT PANE: Clean register form -->
          <div class="w-full md:w-1/2 flex flex-col justify-center items-center overflow-y-auto px-6 py-8 md:px-12 lg:px-20 bg-white">
              <div class="w-full max-w-md space-y-5 text-left my-auto">
                  
                  <!-- Top Logo -->
                  <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded bg-slate-900 flex items-center justify-center p-1.5 shadow">
                          <Cpu class="w-4 h-4 text-civic-gold" />
                      </div>
                      <span class="text-sm font-display font-black tracking-tight text-slate-900 leading-none">Voice<span class="text-civic-gold">Up</span></span>
                  </div>

                  <!-- Header -->
                  <div>
                      <h2 class="text-3xl font-display font-bold text-slate-950 tracking-tight leading-none">Create Account</h2>
                      <p class="text-xs text-slate-400 font-semibold mt-2">Get started with a civic reporter account today.</p>
                  </div>
                  
                  <div v-if="errors.length" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded text-xs font-semibold flex items-start gap-2">
                      <AlertCircle class="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <ul class="list-disc pl-4 space-y-0.5">
                          <li v-for="err in errors" :key="err">{{ err }}</li>
                      </ul>
                  </div>

                  <div v-if="locationFeedback" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded text-xs font-semibold flex items-center gap-2">
                      <CheckCircle class="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      <span>{{ locationFeedback }}</span>
                  </div>

                  <form @submit.prevent="handleRegister" class="space-y-3.5">
                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Full Legal Name</label>
                          <input v-model="form.fullName" type="text" required placeholder="John Doe" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div class="relative" ref="dropdownRef">
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">District / Constituency</label>
                          <div class="flex gap-2">
                              <div class="relative flex-1">
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
                              <button 
                                @click="useCurrentLocation" 
                                type="button" 
                                :disabled="locating"
                                class="bg-[#f4f5f8] hover:bg-slate-200 border border-transparent hover:border-slate-300 text-slate-700 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm relative group shrink-0"
                                title="Locate constituency using current GPS location"
                              >
                                  <span v-if="locating" class="animate-spin h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full"></span>
                                  <MapPin v-else class="w-4.5 h-4.5 text-civic-gold" />
                              </button>
                          </div>
                          
                          <!-- Dropdown Results list -->
                          <div 
                            v-if="showDropdown" 
                            class="absolute z-20 left-0 right-0 mt-1 max-h-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto"
                          >
                              <div 
                                v-if="filteredConstituencies.length === 0" 
                                class="px-4 py-3 text-xs text-slate-400 font-semibold"
                              >
                                  No constituencies found matching "{{ searchQuery }}"
                              </div>
                              <button 
                                v-else
                                v-for="item in filteredConstituencies" 
                                :key="item.id" 
                                type="button"
                                @click="selectConstituency(item)"
                                class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-none text-xs font-semibold flex flex-col cursor-pointer"
                                :class="form.constituency === item.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
                              >
                                  <span class="font-bold">{{ item.name }}</span>
                                  <span class="text-[10px] text-slate-400" v-if="item.mpName">
                                      MP: Hon. {{ item.mpName }} <span v-if="item.region">| {{ item.region }}</span>
                                  </span>
                                  <span class="text-[10px] text-slate-400" v-else-if="item.region">
                                      {{ item.region }}
                                  </span>
                              </button>
                          </div>
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Email</label>
                          <input v-model="form.email" type="email" required placeholder="Enter your email" class="w-full bg-[#f4f5f8] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none border border-transparent focus:border-slate-350 transition-colors" />
                      </div>

                      <div>
                          <label class="block text-[9px] font-black text-[#0f1524] uppercase tracking-widest mb-1">Password</label>
                          <div class="relative flex items-center bg-[#f4f5f8] rounded-xl border border-transparent focus-within:border-slate-350 transition-colors">
                              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required placeholder="Create a password" class="w-full bg-transparent px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none" />
                              <button @click="showPassword = !showPassword" type="button" class="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none border-none bg-transparent">
                                  <Eye v-if="!showPassword" class="w-4.5 h-4.5" />
                                  <EyeOff v-else class="w-4.5 h-4.5" />
                              </button>
                          </div>
                          
                          <!-- Password Strength & Validation Feedback -->
                          <div v-if="showRequirements" class="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100/50 space-y-1.5 transition-all duration-300">
                              <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider">Password Requirements:</span>
                              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                  <div class="flex items-center gap-1.5 text-[10px] font-semibold transition-colors" :class="isMinLength ? 'text-emerald-700' : 'text-slate-400'">
                                      <CheckCircle class="w-3.5 h-3.5 transition-transform" :class="isMinLength ? 'text-emerald-500 scale-110' : 'text-slate-300'" />
                                      <span>Min. 8 characters</span>
                                  </div>
                                  <div class="flex items-center gap-1.5 text-[10px] font-semibold transition-colors" :class="hasUppercase ? 'text-emerald-700' : 'text-slate-400'">
                                      <CheckCircle class="w-3.5 h-3.5 transition-transform" :class="hasUppercase ? 'text-emerald-500 scale-110' : 'text-slate-300'" />
                                      <span>One uppercase letter</span>
                                  </div>
                                  <div class="flex items-center gap-1.5 text-[10px] font-semibold transition-colors" :class="hasLowercase ? 'text-emerald-700' : 'text-slate-400'">
                                      <CheckCircle class="w-3.5 h-3.5 transition-transform" :class="hasLowercase ? 'text-emerald-500 scale-110' : 'text-slate-300'" />
                                      <span>One lowercase letter</span>
                                  </div>
                                  <div class="flex items-center gap-1.5 text-[10px] font-semibold transition-colors" :class="hasNumber ? 'text-emerald-700' : 'text-slate-400'">
                                      <CheckCircle class="w-3.5 h-3.5 transition-transform" :class="hasNumber ? 'text-emerald-500 scale-110' : 'text-slate-300'" />
                                      <span>One number</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div class="space-y-2.5 pt-2">
                          <button type="submit" :disabled="loading" class="w-full bg-black hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-sm cursor-pointer disabled:opacity-50 border-none flex items-center justify-center gap-2">
                              <UiLoadingSpinner v-if="loading" size="xs" color="white" />
                              <span>{{ loading ? 'Creating Account...' : 'Register' }}</span>
                          </button>
                      </div>
                  </form>

                  <!-- Footer -->
                  <div class="text-center pt-2">
                      <p class="text-xs font-bold text-slate-400">
                          Already have an account? 
                          <NuxtLink to="/login" class="text-slate-900 hover:underline ml-1">Sign In</NuxtLink>
                      </p>
                  </div>

              </div>
          </div>
      </div>
  </div>
</template>