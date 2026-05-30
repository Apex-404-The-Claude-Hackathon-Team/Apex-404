<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { FileText, Edit3, Mic, MapPin, UploadCloud, AlertTriangle, ShieldCheck, HelpCircle, ArrowLeft, Cpu } from '@lucide/vue'

const auth = useAuthStore()
const { $api } = useNuxtApp() as any

const mode = ref<'text' | 'voice'>('voice')
const errors = ref<string[]>([])

const form = ref({
  title: '',
  category: '',
  region: '',
  constituency: '',
  ward: '',
  street: '',
  body: ''
})

const submitting = ref(false)
const success = ref(false)

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
        // Handle names set by simulation (e.g. "Suame")
        const idMatched = constituenciesList.value.find((item: any) => item.name.toLowerCase() === newVal.toLowerCase())
        if (idMatched) {
            form.value.constituency = idMatched.id
        }
    }
})

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

// Voice Simulation States
const isRecording = ref(false)
const recordingTime = ref(0)
let timerInterval: any = null

const startRecording = () => {
  isRecording.value = true
  recordingTime.value = 0
  timerInterval = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

const stopRecording = () => {
  isRecording.value = false
  clearInterval(timerInterval)
  
  submitting.value = true
  setTimeout(() => {
    form.value.title = "Drainage Leakage at Central Market Lane"
    form.value.category = "water_sanitation"
    form.value.region = "Ashanti"
    form.value.constituency = "suame"
    form.value.ward = "Atonsu"
    form.value.street = "Central Market Lane, next to Kejetia entrance"
    form.value.body = "Voice Transcription (Translated from Twi): The primary pipeline has developed a major leakage. Clean water is wasting and flooding the street. Vendors are unable to set up their stalls. Immediate action is needed."
    
    submitting.value = false
    mode.value = 'text'
  }, 1500)
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

const mapCategoryToEnum = (cat: string) => {
  const mapping: Record<string, string> = {
    'Infrastructure & Roads': 'roads_transport',
    'Water & Utilities': 'water_sanitation',
    'Public Health & Sanitation': 'waste_management',
    'Education & Schools': 'education',
    'Security & Zoning': 'security'
  }
  return mapping[cat] || 'other'
}


const handleSubmit = async () => {
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
  
  submitting.value = true
  errors.value = []
  
  try {
    const payload = {
      title: form.value.title,
      description: form.value.body,
      category: mapCategoryToEnum(form.value.category),
      constituency: form.value.constituency,
      location: JSON.stringify({
        address: form.value.street,
        city: form.value.ward,
        region: form.value.region,
        country: 'Ghana',
        coordinates: [-1.6244, 6.6904] // Default Suame center
      })
    }

    await $api('/api/posts', {
      method: 'POST',
      body: payload
    })
    
    success.value = true
  } catch (err: any) {
    errors.value = [err.message || 'Failed to submit report. Please try again.']
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen pb-24">
      
      <!-- Submission Header with Unsplash background photo -->
      <div class="relative pt-16 pb-24 px-6 border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80')">
          <!-- Dark overlay for text readability -->
          <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
          <div class="absolute top-[10%] right-[10%] w-72 h-72 bg-civic-blue/5 rounded-full filter blur-3xl pointer-events-none"></div>

          <div class="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <NuxtLink to="/" class="text-[9px] font-black uppercase tracking-widest text-civic-gold hover:text-white flex items-center gap-1.5 mb-4 transition-colors">
                      <ArrowLeft class="w-4 h-4" /> Cancel & Return
                  </NuxtLink>
                  <h1 class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                      Report a Community Problem
                  </h1>
                  <p class="text-slate-400 font-semibold mt-2 text-base max-w-xl">
                      Speak or write your issue. Your report will be sent directly to your Member of Parliament's office for a quick response.
                  </p>
              </div>
          </div>
      </div>

      <div class="container mx-auto px-6 lg:px-12 -mt-16 relative z-20">
          
          <!-- Success Screen -->
          <div v-if="success" class="max-w-3xl mx-auto bg-white rounded-lg shadow-civic border border-slate-200 p-16 text-center">
              <div class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-200 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck class="w-10 h-10" />
              </div>
              <h2 class="text-3xl font-display font-black text-civic-navy uppercase tracking-wide mb-4">Report Sent</h2>
              <p class="text-sm text-slate-500 mb-10 leading-relaxed font-semibold max-w-lg mx-auto">
                  Thank you. Your voice report has been successfully sent to the district office. We have notified your representative.
              </p>
              
              <div class="flex justify-center gap-4 flex-wrap">
                  <NuxtLink to="/" class="bg-civic-navy hover:bg-civic-navy-dark text-white px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-colors rounded shadow-lg shadow-black/10">
                      Return to Home
                  </NuxtLink>
                  <NuxtLink to="/scorecards" class="bg-white border-2 border-civic-navy text-civic-navy hover:bg-slate-50 px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-colors rounded">
                      Check MP Ratings
                  </NuxtLink>
              </div>
          </div>

          <!-- Active Form Screen -->
          <div v-else class="flex flex-col lg:flex-row gap-10">
              
              <!-- Left Form Area -->
              <div class="flex-1 bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden">
                  
                  <!-- Error alert -->
                  <div v-if="errors.length" class="bg-rose-50 border-b border-rose-200 text-rose-700 px-8 py-4 text-xs font-semibold flex items-start gap-2">
                      <AlertTriangle class="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
                      <ul class="list-disc pl-4 space-y-0.5">
                          <li v-for="err in errors" :key="err">{{ err }}</li>
                      </ul>
                  </div>

                  <!-- Form Tabs (Segment control look) -->
                  <div class="flex bg-slate-50 border-b border-slate-200 p-2 gap-2">
                     <button @click="mode = 'voice'" :class="mode === 'voice' ? 'bg-white text-civic-navy shadow border border-slate-200' : 'text-slate-500 hover:bg-slate-100'" class="flex-1 py-4 flex justify-center items-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer rounded">
                          <Mic class="w-4 h-4"/> Speak Report (Voice Mode)
                     </button>
                     <button @click="mode = 'text'" :class="mode === 'text' ? 'bg-white text-civic-navy shadow border border-slate-200' : 'text-slate-500 hover:bg-slate-100'" class="flex-1 py-4 flex justify-center items-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer rounded">
                          <Edit3 class="w-4 h-4"/> Or Type Report (Text Form)
                     </button>
                  </div>

                  <div class="p-8 md:p-10">
                      <!-- Text Mode -->
                      <form v-if="mode === 'text'" @submit.prevent="handleSubmit" class="space-y-6">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              <div class="md:col-span-2">
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">What is the problem? (Short summary) <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                      <input v-model="form.title" type="text" required class="w-full bg-white px-4 py-3.5 font-bold text-sm text-civic-navy outline-none" placeholder="e.g. Broken water pipe at Central Market"/>
                                  </div>
                              </div>

                              <div>
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">Type of Issue <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded relative">
                                      <select v-model="form.category" required class="w-full bg-white px-4 py-3.5 font-bold text-xs text-civic-navy outline-none">
                                          <option value="" disabled selected>Select Category...</option>
                                          <option>Infrastructure & Roads</option>
                                          <option>Water & Utilities</option>
                                          <option>Public Health & Sanitation</option>
                                          <option>Education & Schools</option>
                                          <option>Security & Zoning</option>
                                      </select>
                                  </div>
                              </div>

                              <div>
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">Region <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                      <select v-model="form.region" required class="w-full bg-white px-4 py-3.5 font-bold text-xs text-civic-navy outline-none">
                                          <option value="" disabled selected>Select Region...</option>
                                          <option>Ashanti</option>
                                          <option>Greater Accra</option>
                                          <option>Northern</option>
                                          <option>Western</option>
                                          <option>Volta</option>
                                      </select>
                                  </div>
                              </div>

                              <div class="relative" ref="dropdownRef">
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">District / Constituency <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                      <input 
                                        v-model="searchQuery" 
                                        @focus="showDropdown = true" 
                                        type="text" 
                                        required 
                                        class="w-full bg-white px-4 py-3.5 font-bold text-xs text-civic-navy outline-none" 
                                        placeholder="Search constituency, MP, or region..."
                                      />
                                      <!-- Hidden field to pass to backend -->
                                      <input type="hidden" v-model="form.constituency" />
                                  </div>
                                  
                                  <!-- Dropdown list -->
                                  <div 
                                    v-if="showDropdown" 
                                    class="absolute z-20 left-0 right-0 mt-1 max-h-48 bg-white border border-slate-200 rounded shadow-lg overflow-y-auto"
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
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">Neighborhood / Area <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                      <select v-model="form.ward" required class="w-full bg-white px-4 py-3.5 font-bold text-xs text-civic-navy outline-none">
                                          <option value="" disabled selected>Select Ward...</option>
                                          <option>Atonsu</option>
                                          <option>Nhyiaeso</option>
                                          <option>Santasi</option>
                                          <option>Dakodwom</option>
                                      </select>
                                  </div>
                              </div>

                              <div class="md:col-span-2">
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">Where is this located? (Street & nearest landmark) <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded relative flex items-center">
                                      <MapPin class="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                                      <input v-model="form.street" type="text" required class="w-full bg-white pl-11 pr-4 py-3.5 font-bold text-xs text-civic-navy outline-none" placeholder="e.g. Central Market, opposite Bank of Ghana"/>
                                  </div>
                              </div>

                              <div class="md:col-span-2">
                                  <label class="block text-[10px] font-black text-civic-navy uppercase tracking-widest mb-2">Tell us more details <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                      <textarea v-model="form.body" required rows="5" class="w-full bg-white px-4 py-3.5 font-medium text-xs text-slate-650 outline-none resize-none leading-relaxed" placeholder="Please provide details about the problem, how long it has been there, and why it is a hazard..."></textarea>
                                  </div>
                              </div>
                          </div>

                          <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                              <div class="flex items-center gap-3 text-civic-navy bg-blue-50/50 border border-blue-100 px-4 py-3 rounded w-full sm:w-auto">
                                  <AlertTriangle class="w-4 h-4 text-civic-blue shrink-0" />
                                  <span class="text-[10px] font-bold uppercase tracking-wide leading-tight text-slate-500">Your report will be sent to the <br/> local constituency office for action.</span>
                              </div>
                              <button type="submit" :disabled="submitting" class="w-full sm:w-auto bg-civic-gold hover:bg-civic-gold-hover text-civic-navy-dark font-black uppercase tracking-widest px-10 py-3.5 rounded shadow-lg shadow-civic-gold/15 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                                  <UiLoadingSpinner v-if="submitting" size="xs" color="slate" />
                                  <span>{{ submitting ? 'Sending...' : 'Submit Report' }}</span>
                              </button>
                          </div>
                      </form>

                      <!-- Voice Mode -->
                      <div v-else class="py-12 text-center space-y-8">
                          <!-- Simulated mic button with high-contrast ring glow -->
                          <div class="w-28 h-28 rounded-full p-2.5 mx-auto flex items-center justify-center relative bg-slate-50 border border-slate-200">
                              <button 
                                @click="isRecording ? stopRecording() : startRecording()"
                                :class="isRecording ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-white hover:scale-95' : 'bg-civic-blue text-white shadow-[0_0_20px_rgba(43,108,176,0.3)] hover:scale-105'" 
                                class="w-full h-full rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none border-none z-10"
                              >
                                  <Mic class="w-8 h-8" :class="isRecording ? 'animate-pulse' : ''" />
                              </button>
                          </div>
                          
                          <!-- Animated EQ waves -->
                          <div class="flex justify-center items-end gap-1 h-10 w-full max-w-[200px] mx-auto border-b border-slate-100 pb-1">
                              <div v-if="!isRecording" class="text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 w-full text-center">Ready to Record</div>
                              <template v-else>
                                  <!-- Bouncing bars representing waves -->
                                  <div class="w-1.5 bg-rose-500 rounded animate-[bounce_0.6s_infinite] h-8"></div>
                                  <div class="w-1.5 bg-rose-500 rounded animate-[bounce_0.4s_infinite] h-5"></div>
                                  <div class="w-1.5 bg-rose-400 rounded animate-[bounce_0.8s_infinite] h-10"></div>
                                  <div class="w-1.5 bg-rose-500 rounded animate-[bounce_0.5s_infinite] h-7"></div>
                                  <div class="w-1.5 bg-rose-500 rounded animate-[bounce_0.7s_infinite] h-9"></div>
                                  <div class="w-1.5 bg-rose-400 rounded animate-[bounce_0.3s_infinite] h-4"></div>
                                  <div class="w-1.5 bg-rose-500 rounded animate-[bounce_0.6s_infinite] h-8"></div>
                              </template>
                          </div>

                          <div class="space-y-2">
                              <h3 class="text-xl font-display font-black text-civic-navy uppercase tracking-wide">
                                  {{ isRecording ? 'Recording Voice...' : 'Record Your Problem' }}
                              </h3>
                              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  {{ isRecording ? `Time: ${formatTime(recordingTime)}` : 'Supports English, Twi, Ewe, and Ga' }}
                              </p>
                          </div>
                          
                          <p class="text-xs text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
                              Speak naturally into your device. Tell us your location, neighborhood, and the issue. We will automatically write down your report and send it to your Member of Parliament.
                          </p>

                          <div class="flex justify-center gap-4 flex-wrap">
                              <button 
                                  @click="isRecording ? stopRecording() : startRecording()" 
                                  :class="isRecording ? 'bg-[#0f1524]' : 'bg-rose-500'"
                                  class="text-white font-black uppercase tracking-widest px-8 py-3.5 rounded shadow text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                  <span v-if="isRecording" class="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse"></span>
                                  {{ isRecording ? 'Stop & Submit' : 'Start Speaking Now' }}
                              </button>
                              
                              <button v-if="!isRecording" class="bg-slate-50 border border-slate-200 text-slate-500 font-black uppercase tracking-widest px-6 py-3.5 rounded hover:bg-slate-100 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                                  <UploadCloud class="w-4 h-4"/> Or Upload Audio
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Right Info Sidebar -->
              <div class="lg:w-80 shrink-0">
                  <div class="bg-white rounded-lg shadow-civic border border-slate-200 p-8 sticky top-28">
                      <div class="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-150">
                          <Cpu class="w-5 h-5 text-civic-gold" />
                          <h3 class="text-xs font-display font-black text-civic-navy uppercase tracking-wide">Quick Instructions</h3>
                      </div>
                      
                      <ul class="space-y-6">
                          <li>
                              <h4 class="text-xs font-black text-civic-navy uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-civic-blue"></span> 1. Select Ward</h4>
                              <p class="text-[11px] text-slate-500 font-semibold leading-relaxed">Provide correct neighborhoods (Atonsu, Nhyiaeso, etc.) to target the right MP office.</p>
                          </li>
                          <li>
                              <h4 class="text-xs font-black text-civic-navy uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-civic-gold"></span> 2. Automated Text</h4>
                              <p class="text-[11px] text-slate-500 font-semibold leading-relaxed">Our system automatically types your speech so you don't have to fill anything.</p>
                          </li>
                          <li>
                              <h4 class="text-xs font-black text-civic-navy uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 3. Public Status</h4>
                              <p class="text-[11px] text-slate-500 font-semibold leading-relaxed">Your report is public so other community members can support it.</p>
                          </li>
                      </ul>
                      
                      <div class="mt-8 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-8 -mb-8 p-6 text-center rounded-b-lg">
                          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Constituency Emergency Support</p>
                          <p class="text-civic-navy font-black tracking-widest text-lg">DIAL 112</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>