<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import { 
  MapPin, Phone, Mail, Clock, ThumbsUp, Building, ArrowRight, ShieldAlert, Cpu, Award, 
  CheckCircle, Flame, Star, Activity, AlertTriangle, AlertOctagon, HelpCircle, HardHat, RefreshCw 
} from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import MapWidget from '~/components/ui/MapWidget.vue'

const route = useRoute()
const id = String(route.params.id) // e.g. "mp_1", "mp_2", "mp_3"

const auth = useAuthStore()
const { $api } = useNuxtApp() as any

const selectedFeedTab = ref<'top' | 'recent' | 'unresolved' | 'ignored'>('top')
const selectedCategory = ref('all')

const CATEGORY_MAP: Record<string, string> = {
  roads_transport: 'Infrastructure & Roads',
  water_sanitation: 'Water & Utilities',
  electricity: 'Electricity & Utilities',
  healthcare: 'Healthcare & Clinics',
  education: 'Education & Schools',
  corruption: 'Accountability & Anti-Corruption',
  security: 'Security & Safety',
  flooding: 'Flooding & Drainage',
  waste_management: 'Public Health & Sanitation',
  public_infrastructure: 'Public Infrastructure',
  other: 'Other Concerns'
}

const getCategoryLabel = (cat: string) => {
  return CATEGORY_MAP[cat] || cat
}

const getStatusLabel = (status: string) => {
  const mapping: Record<string, string> = {
    pending: 'new',
    under_review: 'working on it',
    resolved: 'fixed',
    rejected: 'rejected',
    ignored: 'ignored',
    open: 'new',
    acknowledged: 'working on it',
    budgeted: 'budgeted',
    in_progress: 'in progress'
  }
  return mapping[status] || status
}

// Fetch dashboard telemetry
const { data: dashboardData } = await useAsyncData<any>(`constituency-dashboard-${id}`, () => {
  return $api(`/api/dashboard/${id}`).catch((err: any) => {
    console.error('Error fetching constituency dashboard:', err)
    return null
  })
})

// Fetch MP Profile details
const { data: mpProfileData } = await useAsyncData<any>(`mp-profile-${id}`, () => {
  return $api(`/api/mp/${id}`).catch((err: any) => {
    console.error('Error fetching mp profile:', err)
    return null
  })
})

// Fetch all constituencies to resolve dynamic fallback names
const { data: constituenciesData } = await useAsyncData<any>('all-constituencies', () => {
  return $api('/api/location/constituencies').catch(() => null)
})

// Fetch reports list (all posts in this constituency)
const { data: postsData, refresh: refreshReports } = await useAsyncData<any>(`constituency-posts-${id}`, () => {
  return $api(`/api/posts`, {
    query: {
      constituency: id,
      limit: 100
    }
  }).catch((err: any) => {
    console.error('Error fetching constituency posts:', err)
    return { posts: [] }
  })
})

// Fetch projects list
const { data: projectsData } = await useAsyncData<any>(`constituency-projects-${id}`, () => {
  return $api(`/api/projects`, {
    query: {
      constituency: id,
      limit: 100
    }
  }).catch((err: any) => {
    console.error('Error fetching constituency projects:', err)
    return { projects: [] }
  })
})

const mpData = computed(() => {
  const profile = mpProfileData.value?.profile
  const stats = dashboardData.value?.reportStats
  
  // Find constituency details in the list
  const details = constituenciesData.value?.constituencies?.find((c: any) => c.id === id)
  
  let defaultDetails = {
    name: details ? `Hon. ${details.mpName}` : 'Hon. Osei Kyei-Mensah',
    party: details?.party || 'NPP',
    constituency: details ? `${details.name} Assembly` : 'Suame District Assembly',
    region: details ? `${details.region} Region` : 'Ashanti Region',
    contact: details ? `mp.${details.id}@parliament.gh | +233 24 342 9876` : 'osei.kyeimensah@parliament.gh | +233 24 342 9876',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    bio: details ? `Member of Parliament for ${details.name}. Working to build a responsive constituency and transparent public services.` : 'Dedicated to local industrial growth, road safety, and community transparency.',
    wardFilters: ['Atonsu', 'Dakodwom'],
    responseRate: 100,
    resolutionRate: 100,
    ignoredCount: 0
  }

  if (id === 'mp_2') {
    defaultDetails = {
      name: 'Hon. Samuel Okudzeto Ablakwa',
      party: 'NDC',
      constituency: 'North Tongu Assembly',
      region: 'Volta Region',
      contact: 'samuel.ablakwa@parwahl.gh | +233 20 898 7654',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
      bio: 'Representing North Tongu with dedication and focus on water access and education.',
      wardFilters: ['Nhyiaeso'],
      responseRate: 78,
      resolutionRate: 52,
      ignoredCount: 5
    }
  } else if (id === 'mp_3') {
    defaultDetails = {
      name: 'Hon. Haruna Iddrisu',
      party: 'NDC',
      constituency: 'Tamale South',
      region: 'Northern Region',
      contact: 'haruna.iddrisu@parliament.gh | +233 24 412 3456',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
      bio: 'Serving the people of Tamale South with emphasis on health facilities and youth development.',
      wardFilters: ['Santasi'],
      responseRate: 92,
      resolutionRate: 74,
      ignoredCount: 2
    }
  }

  const name = profile?.user
    ? `Hon. ${profile.user.firstName} ${profile.user.lastName}`
    : defaultDetails.name
  
  const party = profile?.party || defaultDetails.party
  const constituency = profile?.constituency === 'mp_1' ? 'Suame District Assembly' : profile?.constituency === 'mp_2' ? 'North Tongu Assembly' : profile?.constituency === 'mp_3' ? 'Tamale South' : defaultDetails.constituency
  const contact = (profile?.contactEmail && profile?.contactPhone)
    ? `${profile.contactEmail} | ${profile.contactPhone}`
    : defaultDetails.contact
  const avatarUrl = profile?.profilePhoto?.url || defaultDetails.avatarUrl
  const bio = profile?.bio || defaultDetails.bio

  return {
    id,
    name,
    party,
    constituency,
    region: defaultDetails.region,
    contact,
    responseRate: stats?.responseRate ?? defaultDetails.responseRate ?? 0,
    resolutionRate: stats?.resolutionRate ?? defaultDetails.resolutionRate ?? 0,
    ignoredCount: stats?.ignoredCount ?? defaultDetails.ignoredCount ?? 0,
    recentAction: bio,
    avatarUrl,
    wardFilters: defaultDetails.wardFilters
  }
})

// Upvoting inside dynamic feed
const backIssue = async (reportId: string) => {
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
  try {
    await $api(`/api/posts/${reportId}/upvote`, {
      method: 'POST'
    })
    await refreshReports()
  } catch (err) {
    console.error('Error upvoting report:', err)
  }
}

const reports = computed(() => postsData.value?.posts || [])
const projects = computed(() => projectsData.value?.projects || [])

const filteredReports = computed(() => {
  let list = [...reports.value]

  if (selectedCategory.value !== 'all') {
    const selectedEnum = Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key] === selectedCategory.value)
    if (selectedEnum) {
      list = list.filter(r => r.category === selectedEnum)
    } else {
      list = list.filter(r => getCategoryLabel(r.category).toLowerCase().includes(selectedCategory.value.toLowerCase()))
    }
  }

  if (selectedFeedTab.value === 'top') {
    list.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
  } else if (selectedFeedTab.value === 'recent') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (selectedFeedTab.value === 'unresolved') {
    list = list.filter(r => r.status !== 'resolved')
  } else if (selectedFeedTab.value === 'ignored') {
    list = list.filter(r => r.status === 'ignored')
  }

  return list
})

const filteredProjects = computed(() => {
  return projects.value
})

const categories = ['all', 'Infrastructure & Roads', 'Water & Utilities', 'Public Health & Sanitation', 'Education & Schools', 'Security & Zoning']

const statusColors = (status: string) => {
  const norm = status?.toLowerCase().replace('_', ' ')
  switch (norm) {
    case 'in progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/30'
    case 'budgeted': return 'text-slate-500 bg-slate-500/10 border-slate-500/30'
    case 'completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    case 'delayed': return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    case 'budget heavy': return 'text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse'
    case 'under review': return 'text-purple-500 bg-purple-500/10 border-purple-500/30'
    default: return 'text-slate-500 bg-slate-100 border-slate-200'
  }
}

const statusIcons = (status: string) => {
  const norm = status?.toLowerCase().replace('_', ' ')
  switch (norm) {
    case 'in progress': return Activity
    case 'budgeted': return Clock
    case 'completed': return CheckCircle
    case 'delayed': return AlertTriangle
    case 'budget heavy': return AlertOctagon
    case 'under review':
    case 'under_review': return RefreshCw
    default: return HardHat
  }
}

const getProgressPercent = (status: string) => {
  const norm = status?.toLowerCase().replace('_', ' ')
  switch (norm) {
    case 'completed': return 100
    case 'in progress': return 65
    case 'under review': return 35
    case 'delayed': return 45
    case 'budget heavy': return 80
    case 'budgeted': return 10
    default: return 0
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// SVG Dasharray helper for Radial Gauges
const getCircumference = (radius: number) => 2 * Math.PI * radius
const getStrokeDashOffset = (percent: number, radius: number) => {
  const circumference = getCircumference(radius)
  return circumference - (percent / 100) * circumference
}
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen pb-24">
      
      <!-- MP Profile Section with Unsplash background photo -->
      <div class="relative pt-16 pb-28 px-6 border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=80')">
          <!-- Dark overlay for text readability -->
          <div class="absolute inset-0 bg-slate-950/80 z-0"></div>
          <div class="absolute top-[20%] left-[10%] w-[380px] h-[380px] bg-civic-blue/10 rounded-full filter blur-[100px] pointer-events-none z-0"></div>
          
          <div class="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              
              <!-- Left side: Profile -->
              <div class="flex items-center gap-6">
                  <!-- Large MP profile portrait image -->
                  <div class="relative shrink-0">
                      <img :src="mpData.avatarUrl" :alt="mpData.name" class="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-civic-gold object-cover shadow-2xl shadow-civic-gold/25" />
                  </div>
                  <div class="space-y-2 text-left">
                      <div class="flex items-center gap-2">
                          <span class="text-[9px] bg-civic-blue/10 text-civic-blue border border-civic-blue/25 font-black px-2 py-0.5 rounded uppercase tracking-widest">{{ mpData.party }}</span>
                          <span class="text-slate-400 text-xs font-semibold">{{ mpData.region }}</span>
                      </div>
                      <h1 class="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-tight leading-none">{{ mpData.name }}</h1>
                      <p class="text-xs text-slate-400 font-bold flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5 text-civic-blue"/> Representative for {{ mpData.constituency }}</p>
                  </div>
              </div>

              <!-- Right side: contact coordinates -->
              <div class="bg-[#0f1524] border border-white/5 p-5 rounded max-w-sm w-full text-xs space-y-2.5 shadow-xl text-left">
                  <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">Constituency Office Details</span>
                  <p class="text-slate-300 font-semibold flex items-center gap-2 leading-none"><Mail class="w-4 h-4 text-civic-blue" /> {{ mpData.contact.split(' | ')[0] }}</p>
                  <p class="text-slate-300 font-semibold flex items-center gap-2 leading-none"><Phone class="w-4 h-4 text-civic-blue" /> {{ mpData.contact.split(' | ')[1] }}</p>
              </div>

          </div>
      </div>

      <!-- Main Layout Section -->
      <div class="container mx-auto px-6 lg:px-12 -mt-16 relative z-20 space-y-12">
          
          <!-- Public Accountability Scoreboard Row with SVG Charts -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <!-- SVG Radial Gauge: Response Rate -->
              <div class="bg-white border border-slate-200/80 rounded-lg p-6 flex items-center justify-between shadow-civic relative overflow-hidden">
                  <div class="absolute top-0 left-0 right-0 h-[3px] bg-civic-blue"></div>
                  <div class="text-left">
                      <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Response Rate</span>
                      <h3 class="text-3xl font-display font-black text-civic-navy mt-1.5">{{ mpData.responseRate }}%</h3>
                      <p class="text-[10px] text-slate-500 font-semibold mt-1">Official acknowledgment pace</p>
                  </div>
                  <!-- Radial Gauge -->
                  <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg class="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" stroke-width="4.5" />
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="#2b6cb0" stroke-width="4.5" 
                                  :stroke-dasharray="getCircumference(28)" 
                                  :stroke-dashoffset="getStrokeDashOffset(mpData.responseRate, 28)" 
                                  stroke-linecap="round" />
                      </svg>
                      <Star class="w-4 h-4 text-civic-blue absolute" />
                  </div>
              </div>

              <!-- SVG Radial Gauge: Resolution Rate -->
              <div class="bg-white border border-slate-200/80 rounded-lg p-6 flex items-center justify-between shadow-civic relative overflow-hidden">
                  <div class="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
                  <div class="text-left">
                      <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resolution Rate</span>
                      <h3 class="text-3xl font-display font-black text-civic-navy mt-1.5">{{ mpData.resolutionRate }}%</h3>
                      <p class="text-[10px] text-slate-500 font-semibold mt-1">On-ground resolved issues</p>
                  </div>
                  <!-- Radial Gauge -->
                  <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg class="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" stroke-width="4.5" />
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="#10b981" stroke-width="4.5" 
                                  :stroke-dasharray="getCircumference(28)" 
                                  :stroke-dashoffset="getStrokeDashOffset(mpData.resolutionRate, 28)" 
                                  stroke-linecap="round" />
                      </svg>
                      <CheckCircle class="w-4 h-4 text-emerald-500 absolute" />
                  </div>
              </div>

              <!-- ignored issue stats card -->
              <div class="bg-white border border-slate-200/80 rounded-lg p-6 flex items-center justify-between shadow-civic relative overflow-hidden">
                  <div class="absolute top-0 left-0 right-0 h-[3px] bg-rose-500"></div>
                  <div class="text-left">
                      <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ignored Reports</span>
                      <h3 class="text-3xl font-display font-black text-rose-600 mt-1.5">{{ mpData.ignoredCount }}</h3>
                      <p class="text-[10px] text-slate-500 font-semibold mt-1">Unaddressed citizen files</p>
                  </div>
                  <div class="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                      <ShieldAlert class="w-5 h-5" />
                  </div>
              </div>
          </div>

          <!-- Bottom Grid: Feed & Projects (8 cols) vs Map (4 cols) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              <!-- Left side: Feed & Project logs (8 Cols) -->
              <div class="lg:col-span-8 space-y-12">
                  
                  <!-- Localized Citizen Feed -->
                  <div class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden">
                      <div class="bg-civic-navy px-8 py-5 border-b border-white/5 flex flex-wrap justify-between items-center gap-4 text-left">
                          <div>
                              <h2 class="text-xs font-display font-black text-white uppercase tracking-wider">Constituency Complaints Feed</h2>
                              <p class="text-[9px] font-bold text-slate-550 uppercase tracking-widest mt-0.5">Filtering wards: {{ mpData.wardFilters?.join(', ') || 'All Wards' }}</p>
                          </div>
                          
                          <!-- sorting selectors -->
                          <div class="flex bg-civic-navy-dark rounded-full p-0.5 border border-white/5">
                            <button 
                              v-for="tab in ['top', 'recent', 'unresolved', 'ignored'] as const"
                              :key="tab"
                              @click="selectedFeedTab = tab" 
                              :class="selectedFeedTab === tab ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
                              class="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              {{ tab === 'top' ? 'Most Backed' : tab }}
                            </button>
                          </div>
                      </div>

                      <div class="px-8 py-3.5 bg-slate-50 border-b border-slate-200/60 overflow-x-auto flex gap-2 scrollbar-none">
                        <button 
                          v-for="cat in categories" 
                          :key="cat"
                          @click="selectedCategory = cat"
                          :class="selectedCategory === cat ? 'bg-civic-navy text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-200 hover:text-slate-700'"
                          class="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all whitespace-nowrap cursor-pointer"
                        >
                          {{ cat === 'all' ? 'All Issues' : cat }}
                        </button>
                      </div>

                      <!-- Feed List -->
                      <div class="divide-y divide-slate-100">
                          <div v-if="filteredReports.length === 0" class="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                              No localized reports match.
                          </div>
                          <div v-for="report in filteredReports" :key="report._id" class="p-8 flex flex-col sm:flex-row gap-6 hover:bg-[#fcfdfe] transition-all">
                              
                              <div class="sm:w-24 shrink-0 flex flex-col items-center justify-center">
                                  <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Backing</span>
                                  <span class="bg-slate-50 text-slate-700 font-black text-xl px-4 py-2 border border-slate-200/80 rounded w-full text-center">{{ report.upvotes?.length || report.upvoteCount || 0 }}</span>
                                  <button @click="backIssue(report._id)" class="w-full mt-2 bg-white border border-civic-gold/50 text-civic-gold hover:bg-civic-gold hover:text-white rounded py-1.5 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer">
                                      Endorse
                                  </button>
                              </div>

                              <div class="flex-1 flex flex-col justify-between text-left">
                                  <div>
                                      <div class="flex items-center gap-2 mb-2 flex-wrap">
                                          <span class="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest rounded border"
                                                :class="{
                                                    'bg-rose-50 border-rose-200 text-rose-600': report.status === 'open' || report.status === 'pending',
                                                    'bg-amber-50 border-amber-200 text-amber-700': report.status === 'acknowledged' || report.status === 'under_review',
                                                    'bg-blue-50 border-blue-200 text-blue-700': report.status === 'budgeted' || report.status === 'in_progress',
                                                    'bg-slate-55 border-slate-200 text-slate-600': report.status === 'ignored' || report.status === 'rejected',
                                                    'bg-emerald-50 border-emerald-200 text-emerald-700': report.status === 'resolved'
                                                }">{{ getStatusLabel(report.status) }}</span>
                                          <span class="text-[8px] font-black uppercase tracking-widest text-civic-navy bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">{{ getCategoryLabel(report.category) }}</span>
                                      </div>
                                      <NuxtLink :to="`/reports/${report._id}`" class="text-lg font-bold font-display text-civic-navy hover:text-civic-blue transition-colors line-clamp-1">{{ report.title }}</NuxtLink>
                                      <p class="text-xs text-slate-500 font-semibold line-clamp-2 mt-1">{{ report.description || report.body }}</p>
                                  </div>
                                  <div class="flex justify-between items-center border-t border-slate-100 pt-3 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      <span class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5 text-slate-300"/> {{ report.location?.address || report.location || 'Suame' }}</span>
                                      <NuxtLink :to="`/reports/${report._id}`" class="text-civic-blue font-black uppercase tracking-widest flex items-center gap-1">Details <ArrowRight class="w-3 h-3"/></NuxtLink>
                                  </div>
                              </div>

                          </div>
                      </div>
                  </div>

                  <!-- Localized Projects Grid -->
                  <div class="bg-white rounded-lg shadow-civic border border-slate-200 p-8 space-y-6 text-left">
                      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
                          <h2 class="text-xs font-display font-black text-civic-navy uppercase tracking-wider flex items-center gap-2">
                              <HardHat class="w-4.5 h-4.5 text-civic-gold" /> Active Local Projects
                          </h2>
                          <NuxtLink to="/projects" class="text-[9px] font-black text-civic-blue uppercase tracking-widest hover:text-civic-navy transition-colors">See all projects</NuxtLink>
                      </div>

                      <div class="divide-y divide-slate-100 space-y-6">
                          <div v-if="filteredProjects.length === 0" class="text-center text-slate-400 font-bold uppercase tracking-widest text-xs py-4">No active initiatives found.</div>
                          <div v-for="proj in filteredProjects" :key="proj._id" class="pt-6 first:pt-0 space-y-3">
                              <div class="flex items-center justify-between gap-4">
                                  <div class="flex items-center gap-2.5">
                                      <span :class="statusColors(proj.status)" class="flex items-center gap-1 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border rounded">
                                          <component :is="statusIcons(proj.status)" class="w-3 h-3" /> {{ getStatusLabel(proj.status) }}
                                      </span>
                                      <h4 class="font-bold text-sm text-civic-navy uppercase tracking-tight">{{ proj.title }}</h4>
                                  </div>
                                  <span class="text-xs font-black text-slate-400 uppercase tracking-widest">{{ proj.budget ? (typeof proj.budget === 'number' ? proj.budget.toLocaleString() + ' GHS' : proj.budget) : 'TBD' }}</span>
                              </div>
                              <p class="text-xs text-slate-500 font-medium leading-relaxed">{{ proj.description }}</p>
                              
                              <div class="w-full space-y-1">
                                  <div class="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                      <span>Completion progress</span>
                                      <span>{{ getProgressPercent(proj.status) }}%</span>
                                  </div>
                                  <div class="h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                      <div class="h-full bg-gradient-to-r from-slate-300 to-civic-blue" :style="`width: ${getProgressPercent(proj.status)}%`"></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>

              <!-- Right side: constituency Radar map & notices (4 Cols) -->
              <div class="lg:col-span-4 space-y-6">
                  
                  <!-- Constituency Radar Map -->
                  <MapWidget :reports="filteredReports" />
                  
                  <!-- Latest action panel -->
                  <div class="bg-civic-navy-dark text-white rounded-lg p-6 shadow-2xl grid-bg border border-white/5 space-y-4 text-left">
                      <div class="border-b border-white/5 pb-2.5">
                          <h3 class="text-xs font-black uppercase tracking-widest text-civic-gold">Latest Representative Intervention</h3>
                      </div>
                      <p class="text-xs text-slate-300 font-semibold leading-relaxed">
                          {{ mpData.recentAction }}
                      </p>
                      <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Audit Period: Q4 2026</span>
                  </div>

              </div>

          </div>

      </div>

  </div>
</template>
