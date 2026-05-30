<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { FileText, Users, AlertTriangle, LayoutDashboard, BrainCircuit, Activity, BookOpen, Search, Filter, MessageSquare, CheckCircle, HardHat, Cpu } from '@lucide/vue'

definePageMeta({ middleware: 'mp', layout: false })

const auth = useAuthStore()
const { $api } = useNuxtApp() as any

const selectedMenu = ref<'overview' | 'respond' | 'projects' | 'ai-briefs'>('overview')
const activeBriefTab = ref<'clusters' | 'hotspots' | 'sentiment'>('clusters')

// Form States
const targetReportId = ref('')
const mpResponseText = ref('')
const mpResponseStatus = ref('under_review')
const submittingResponse = ref(false)

const targetProjectId = ref('')
const projectNewStatus = ref('in_progress')
const projectNewDesc = ref('')
const submittingProject = ref(false)

// Message Banner
const notificationMsg = ref('')

const constituencyId = computed(() => auth.user?.constituency || 'mp_1')

// Fetch constituency posts
const { data: postsData, refresh: refreshReports } = await useAsyncData<any>('mp-reports', () => {
  return $api('/api/posts', {
    query: {
      constituency: constituencyId.value,
      limit: 100
    }
  }).catch((err: any) => {
    console.error('Error fetching MP reports:', err)
    return { posts: [] }
  })
}, {
  watch: [constituencyId]
})

// Fetch constituency projects
const { data: projectsData, refresh: refreshProjects } = await useAsyncData<any>('mp-projects', () => {
  return $api('/api/projects', {
    query: {
      constituency: constituencyId.value,
      limit: 100
    }
  }).catch((err: any) => {
    console.error('Error fetching MP projects:', err)
    return { projects: [] }
  })
}, {
  watch: [constituencyId]
})

const reports = computed(() => postsData.value?.posts || [])
const projects = computed(() => projectsData.value?.projects || [])

// Stat Computations
const stats = computed(() => {
  const unresolved = reports.value.filter((r: any) => r.status !== 'resolved').length
  const ignored = reports.value.filter((r: any) => r.status === 'ignored').length
  const resolved = reports.value.filter((r: any) => r.status === 'resolved').length
  
  return [
    { title: 'Active Incidents', value: String(unresolved), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
    { title: 'Ignored Backlog', value: String(ignored), icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' },
    { title: 'AI Synthesized Wards', value: '4', icon: BrainCircuit, color: 'text-civic-blue', bg: 'bg-blue-500/10 border-blue-500/30' },
    { title: 'Resolutions Logged', value: String(resolved), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' }
  ]
})

const { data: briefingData, pending: loadingBriefing } = await useAsyncData<any>('mp-briefing', () => {
  return $api(`/api/ai/briefing/${constituencyId.value}`)
}, {
  watch: [constituencyId]
})

const briefing = computed(() => briefingData.value?.briefing || null)

const recentBriefs = computed(() => {
  if (!briefing.value) return []
  const unresolvedCount = reports.value.filter((r: any) => r.status !== 'resolved').length
  let severity = 'MODERATE'
  if (unresolvedCount > 15) severity = 'CRITICAL'
  else if (unresolvedCount > 5) severity = 'HIGH'
  
  return [
    {
      id: 'current',
      title: briefing.value.executiveSummary ? (briefing.value.executiveSummary.slice(0, 80) + '...') : 'Constituency Status Briefing',
      severity: severity,
      date: new Date(briefingData.value?.generatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      sources: String(reports.value.length)
    }
  ]
})

const submitMPResponse = async () => {
  if (!targetReportId.value || !mpResponseText.value) return
  
  submittingResponse.value = true
  try {
    await $api(`/api/posts/${targetReportId.value}/status`, {
      method: 'PATCH',
      body: {
        status: mpResponseStatus.value,
        officialResponse: mpResponseText.value
      }
    })
    
    notificationMsg.value = `Response successfully posted. Citizen report status updated to "${mpResponseStatus.value}".`
    mpResponseText.value = ''
    targetReportId.value = ''
    
    await refreshReports()
    setTimeout(() => { notificationMsg.value = '' }, 4000)
  } catch (err: any) {
    console.error('Error posting official response:', err)
    notificationMsg.value = `Error posting response: ${err.data?.message || err.message}`
    setTimeout(() => { notificationMsg.value = '' }, 5000)
  } finally {
    submittingResponse.value = false
  }
}

const submitProjectUpdate = async () => {
  if (!targetProjectId.value || !projectNewStatus.value) return
  
  submittingProject.value = true
  try {
    // 1. Update status
    await $api(`/api/projects/${targetProjectId.value}/status`, {
      method: 'PATCH',
      body: {
        status: projectNewStatus.value
      }
    })
    
    // 2. Add update description text if provided
    if (projectNewDesc.value) {
      await $api(`/api/projects/${targetProjectId.value}/updates`, {
        method: 'POST',
        body: {
          body: projectNewDesc.value
        }
      })
    }
    
    notificationMsg.value = `Government Project status updated successfully.`
    targetProjectId.value = ''
    projectNewStatus.value = 'in_progress'
    projectNewDesc.value = ''
    
    await refreshProjects()
    setTimeout(() => { notificationMsg.value = '' }, 4000)
  } catch (err: any) {
    console.error('Error updating project:', err)
    notificationMsg.value = `Error updating project: ${err.data?.message || err.message}`
    setTimeout(() => { notificationMsg.value = '' }, 5000)
  } finally {
    submittingProject.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-800">
      
      <!-- MP Sidebar Panel (SaaS Style, Clean Light Layout) -->
      <aside class="w-72 bg-white text-slate-800 flex flex-col border-r border-slate-200 shrink-0 z-20 shadow-sm">
          <div class="h-[85px] flex items-center px-8 border-b border-slate-200 bg-slate-50">
              <div class="flex items-center gap-2">
                  <Cpu class="w-5 h-5 text-civic-blue animate-pulse" />
                  <h2 class="font-display font-black text-lg uppercase tracking-wider text-civic-navy">Voice<span class="text-civic-gold">Up</span></h2>
              </div>
          </div>
          
          <div class="p-8 pb-4 border-b border-slate-200 bg-white">
              <div class="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full mb-4 flex items-center justify-center shadow-sm">
                  <span class="text-xl text-civic-gold font-black">MP</span>
              </div>
              <h3 class="text-base font-black leading-tight text-civic-navy">{{ auth.user?.name || 'Hon. John Doe' }}</h3>
              <p class="text-[9px] text-civic-gold font-bold uppercase tracking-widest mt-1">Elected Representative</p>
          </div>

          <nav class="flex-1 px-4 space-y-1.5 overflow-y-auto mt-6">
              <button 
                @click="selectedMenu = 'overview'" 
                :class="selectedMenu === 'overview' ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'" 
                class="w-full flex items-center gap-3 px-4 py-3.5 rounded text-[10px] font-black uppercase tracking-widest transition-all text-left focus:outline-none cursor-pointer"
              >
                  <LayoutDashboard class="w-4.5 h-4.5" /> Overview Panel
              </button>
              <button 
                @click="selectedMenu = 'respond'" 
                :class="selectedMenu === 'respond' ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'" 
                class="w-full flex items-center gap-3 px-4 py-3.5 rounded text-[10px] font-black uppercase tracking-widest transition-all text-left focus:outline-none cursor-pointer"
              >
                  <MessageSquare class="w-4.5 h-4.5" /> Citizen responses
              </button>
              <button 
                @click="selectedMenu = 'projects'" 
                :class="selectedMenu === 'projects' ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'" 
                class="w-full flex items-center gap-3 px-4 py-3.5 rounded text-[10px] font-black uppercase tracking-widest transition-all text-left focus:outline-none cursor-pointer"
              >
                  <HardHat class="w-4.5 h-4.5" /> Project manager
              </button>
              <button 
                @click="selectedMenu = 'ai-briefs'" 
                :class="selectedMenu === 'ai-briefs' ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'" 
                class="w-full flex items-center gap-3 px-4 py-3.5 rounded text-[10px] font-black uppercase tracking-widest transition-all text-left focus:outline-none cursor-pointer"
              >
                  <BrainCircuit class="w-4.5 h-4.5" /> AI brief intelligence
              </button>
          </nav>
          
          <div class="p-6 border-t border-slate-200 bg-slate-50">
              <NuxtLink to="/" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">
                  &leftarrow; Exit Console
              </NuxtLink>
          </div>
      </aside>

      <!-- Main Dashboard Content (SaaS Grid) -->
      <main class="flex-1 flex flex-col h-screen overflow-hidden z-10">
          
          <!-- Top utility bar -->
          <header class="h-[85px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
             <div>
                 <h1 class="text-xl font-display font-black text-slate-800 uppercase tracking-wider">Office Telemetry Node</h1>
                 <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{{ auth.user?.constituency === 'mp_1' ? 'Suame District Assembly' : auth.user?.constituency === 'mp_2' ? 'North Tongu Assembly' : auth.user?.constituency === 'mp_3' ? 'Tamale South' : 'Accra Central Constituency' }}</p>
             </div>
             <div>
                 <span class="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 font-black px-3 py-1.5 rounded uppercase tracking-widest shadow-sm">
                     Admin Status: Operational
                 </span>
             </div>
          </header>

          <div class="flex-1 overflow-y-auto p-8 relative">
              
              <!-- Notification Banner -->
              <div v-if="notificationMsg" class="mb-6 bg-emerald-50 border border-emerald-250 text-emerald-600 p-4 rounded text-xs font-black flex items-center gap-2 animate-bounce">
                  <CheckCircle class="w-5 h-5 text-emerald-500 shrink-0" />
                  {{ notificationMsg }}
              </div>

              <!-- ================= SECTION: OVERVIEW ================= -->
              <div v-if="selectedMenu === 'overview'" class="space-y-10">
                  
                  <!-- Metrics Cards -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div v-for="stat in stats" :key="stat.title" class="bg-white rounded border border-slate-200 p-6 flex items-center justify-between shadow-civic">
                          <div>
                              <p class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5 border-b border-slate-100 pb-2 inline-block">{{ stat.title }}</p>
                              <p class="text-3xl font-display font-black text-slate-800 mt-1">{{ stat.value }}</p>
                          </div>
                          <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border" :class="[stat.bg, stat.color]">
                              <component :is="stat.icon" class="w-5 h-5" />
                          </div>
                      </div>
                  </div>

                  <!-- Content Grid -->
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <!-- AI Briefs Panel -->
                      <div class="lg:col-span-2 space-y-5">
                          <div class="flex items-center justify-between">
                              <h2 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                  <BrainCircuit class="w-4.5 h-4.5 text-civic-blue animate-pulse" /> AI Brief Aggregation
                              </h2>
                              <button @click="selectedMenu = 'ai-briefs'" class="text-[9px] font-black text-civic-blue uppercase tracking-widest hover:text-slate-855 transition-colors cursor-pointer">
                                  Configure briefs
                              </button>
                          </div>
                          <div class="bg-white rounded border border-slate-200 shadow-civic overflow-hidden">
                              <div class="bg-slate-50 text-slate-500 px-6 py-4 flex items-center justify-between border-b border-slate-200">
                                  <span class="text-[9px] font-black uppercase tracking-widest">Document Brief Title</span>
                                  <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Threat Severity</span>
                              </div>
                              <div class="divide-y divide-slate-100">
                                  <div v-if="recentBriefs.length === 0" class="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                      No AI briefs compiled yet.
                                  </div>
                                  <div v-else v-for="brief in recentBriefs" :key="brief.id" class="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                                      <div class="space-y-1.5">
                                          <div class="flex items-center gap-3">
                                              <span class="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest" :class="{
                                                  'bg-rose-55 text-rose-600 border border-rose-200': brief.severity === 'CRITICAL',
                                                  'bg-amber-55 text-amber-600 border border-amber-200': brief.severity === 'HIGH',
                                                  'bg-blue-50 text-blue-600 border border-blue-200': brief.severity === 'MODERATE'
                                              }">{{ brief.severity }}</span>
                                              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ brief.date }}</span>
                                          </div>
                                          <h3 class="text-sm font-bold text-slate-800 leading-snug">{{ brief.title }}</h3>
                                          <p class="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                              <FileText class="w-3.5 h-3.5 text-slate-450" /> Aggregated from {{ brief.sources }} verified citizen reports
                                          </p>
                                      </div>
                                      <button @click="selectedMenu = 'ai-briefs'" class="border border-civic-blue text-civic-blue hover:bg-civic-blue hover:text-white px-3.5 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer shadow-sm">
                                          Review
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- Quick Operations -->
                      <div class="space-y-5">
                          <h2 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <Filter class="w-4.5 h-4.5 text-slate-500" /> Quick Operations
                          </h2>
                          
                          <div class="bg-white rounded border border-slate-200 shadow-civic p-6 space-y-6">
                              <div class="space-y-3 text-left">
                                  <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Pending Citizen Reports</h3>
                                  <p class="text-xs font-semibold text-slate-500 leading-normal">You have {{ reports.filter((r: any) => r.status === 'pending' || r.status === 'open').length }} unacknowledged reports in your district.</p>
                                  <button @click="selectedMenu = 'respond'" class="w-full bg-civic-blue hover:bg-civic-blue-hover text-white font-black uppercase tracking-widest text-[9px] py-3 rounded transition-colors cursor-pointer border-none">
                                      Post Response Statement
                                  </button>
                              </div>
                              
                              <div class="border-t border-slate-200 pt-6 space-y-3 text-left">
                                  <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Infrastructure Projects</h3>
                                  <p class="text-xs font-semibold text-slate-500 leading-normal">Modify ongoing government commitments to match citizen checkups.</p>
                                  <button @click="selectedMenu = 'projects'" class="w-full bg-slate-50 border border-slate-200 text-slate-850 hover:bg-slate-100 font-black uppercase tracking-widest text-[9px] py-3 rounded transition-all cursor-pointer">
                                      Manage Commitments
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- ================= SECTION: RESPOND TO CITIZENS ================= -->
              <div v-if="selectedMenu === 'respond'" class="max-w-3xl space-y-6 text-left">
                  <div class="border-b border-slate-200 pb-3">
                      <h2 class="text-lg font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquare class="w-5 h-5 text-civic-blue animate-pulse" /> Submit Official Response Statement
                      </h2>
                      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Publish official actions, budgets, or responses on active citizen reports.</p>
                  </div>

                  <div class="bg-white border border-slate-200 rounded p-8 shadow-civic">
                      <form @submit.prevent="submitMPResponse" class="space-y-6">
                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Active Citizen Report <span class="text-rose-500">*</span></label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <select v-model="targetReportId" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                      <option value="" disabled selected>Select report to respond to...</option>
                                      <option v-for="r in reports.filter((r: any) => r.status !== 'resolved')" :key="r._id" :value="r._id">
                                          [{{ r.status.toUpperCase() }}] {{ r.title }} (Endorsements: {{ r.upvotes?.length || r.upvoteCount || 0 }})
                                      </option>
                                  </select>
                              </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Update Issue Status <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-355 bg-slate-50 rounded transition-all">
                                      <select v-model="mpResponseStatus" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                          <option value="under_review">Under Review (Acknowledged &amp; Working on it)</option>
                                          <option value="resolved">Resolved (Fix implemented on-ground)</option>
                                          <option value="ignored">Ignored (Decline further intervention)</option>
                                          <option value="rejected">Rejected</option>
                                      </select>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Official Statement Response Text <span class="text-rose-500">*</span></label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <textarea v-model="mpResponseText" required rows="5" class="w-full bg-slate-50 text-slate-800 px-4 py-3 text-xs outline-none resize-none leading-relaxed border-none" placeholder="Explain the actions taken by your office, allocated budgets, or timeline to resolve..."></textarea>
                              </div>
                          </div>

                          <div class="pt-4 border-t border-slate-200 flex justify-end">
                              <button type="submit" :disabled="submittingResponse" class="bg-civic-blue hover:bg-civic-blue-hover text-white font-black uppercase tracking-widest px-8 py-3 rounded text-xs transition-colors shadow-lg cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50">
                                  <UiLoadingSpinner v-if="submittingResponse" size="xs" color="white" />
                                  <span>{{ submittingResponse ? 'Publishing...' : 'Publish Response' }}</span>
                              </button>
                          </div>
                      </form>
                  </div>
              </div>

              <!-- ================= SECTION: MANAGE PROJECTS ================= -->
              <div v-if="selectedMenu === 'projects'" class="max-w-3xl space-y-6 text-left">
                  <div class="border-b border-slate-200 pb-3">
                      <h2 class="text-lg font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <HardHat class="w-5 h-5 text-civic-gold animate-pulse" /> Update Government Project Tracker
                      </h2>
                      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Publish updates to government commitments in your constituency.</p>
                  </div>

                  <div class="bg-white border border-slate-200 rounded p-8 shadow-civic">
                      <form @submit.prevent="submitProjectUpdate" class="space-y-6">
                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Active Project <span class="text-rose-500">*</span></label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <select v-model="targetProjectId" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                      <option value="" disabled selected>Select project to update...</option>
                                      <option v-for="p in projects" :key="p._id" :value="p._id">
                                          [{{ p.status.toUpperCase() }}] {{ p.title }} ({{ p.budget ? p.budget.toLocaleString() + ' GHS' : 'TBD' }})
                                      </option>
                                  </select>
                              </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">New Project Status <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-355 bg-slate-50 rounded transition-all">
                                      <select v-model="projectNewStatus" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                          <option value="budgeted">Budgeted</option>
                                          <option value="in_progress">In Progress</option>
                                          <option value="completed">Completed</option>
                                          <option value="delayed">Delayed</option>
                                          <option value="budget_heavy">Budget Heavy</option>
                                          <option value="under_review">Under Review</option>
                                      </select>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Update Project Progress Description (Optional)</label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <textarea v-model="projectNewDesc" rows="4" class="w-full bg-slate-50 text-slate-800 px-4 py-3 text-xs outline-none resize-none leading-relaxed border-none" placeholder="Explain details regarding the current project phase or updates..."></textarea>
                              </div>
                          </div>

                          <div class="pt-4 border-t border-slate-200 flex justify-end">
                              <button type="submit" :disabled="submittingProject" class="bg-civic-gold hover:bg-civic-gold-hover text-civic-navy-dark font-black uppercase tracking-widest px-8 py-3 rounded text-xs transition-colors shadow-lg cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50">
                                  <UiLoadingSpinner v-if="submittingProject" size="xs" color="slate" />
                                  <span>{{ submittingProject ? 'Committing...' : 'Commit Project Update' }}</span>
                              </button>
                          </div>
                      </form>
                  </div>
              </div>

              <!-- ================= SECTION: AI BRIEFS ================= -->
              <div v-if="selectedMenu === 'ai-briefs'" class="space-y-6 text-left">
                  <div class="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <div>
                          <h2 class="text-lg font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <BrainCircuit class="w-5 h-5 text-civic-blue animate-pulse" /> AI Constituency Insights & Synthesis
                          </h2>
                          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">AI-generated priorities, sentiment metrics, and action plans.</p>
                      </div>
                      <div v-if="loadingBriefing" class="flex items-center gap-2 text-slate-400 text-xs font-bold">
                          <span class="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                          <span>Regenerating Brief...</span>
                      </div>
                  </div>

                  <div v-if="!briefing" class="bg-white border border-slate-200 rounded p-12 text-center text-slate-450 font-bold uppercase tracking-widest text-xs">
                      No AI insights available for this constituency.
                  </div>

                  <div v-else class="space-y-6">
                      <!-- Executive Summary Card -->
                      <div class="bg-gradient-to-br from-slate-900 to-slate-955 text-white rounded-xl p-8 border border-white/5 relative overflow-hidden shadow-lg">
                          <div class="absolute right-[-10%] bottom-[-20%] w-72 h-72 bg-civic-blue/15 rounded-full filter blur-3xl pointer-events-none"></div>
                          <span class="text-[8px] bg-civic-blue/20 text-civic-blue border border-civic-blue/35 font-black px-2.5 py-1 rounded uppercase tracking-widest">Executive Summary</span>
                          <p class="text-sm font-semibold text-slate-300 leading-relaxed mt-4 max-w-3xl">
                              {{ briefing.executiveSummary }}
                          </p>
                      </div>

                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <!-- Left/Middle: Priorities & Actions -->
                          <div class="lg:col-span-2 space-y-6">
                              <!-- Top Priorities -->
                              <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-civic space-y-4">
                                  <h3 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Critical Citizen Issues</h3>
                                  <div class="divide-y divide-slate-100 space-y-4">
                                      <div v-for="(item, index) in briefing.topPriorities" :key="index" class="pt-4 first:pt-0 space-y-2">
                                          <div class="flex items-center gap-2">
                                              <span class="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest" :class="{
                                                  'bg-rose-50 border border-rose-205 text-rose-600': item.urgency === 'high',
                                                  'bg-amber-55 border border-amber-205 text-amber-600': item.urgency === 'medium',
                                                  'bg-blue-50 border border-blue-205 text-blue-600': item.urgency === 'low'
                                              }">{{ item.urgency }} Urgency</span>
                                              <h4 class="font-bold text-xs text-slate-800 uppercase tracking-tight">{{ item.issue }}</h4>
                                          </div>
                                          <p class="text-[11px] text-slate-500 font-semibold leading-relaxed pl-1 border-l-2 border-slate-200">
                                              <span class="font-black text-slate-700">Recommended Action:</span> {{ item.recommendedAction }}
                                          </p>
                                      </div>
                                  </div>
                              </div>

                              <!-- Action Plan Checklist -->
                              <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-civic space-y-4">
                                  <h3 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Recommended Office Action Plan</h3>
                                  <ul class="space-y-3">
                                      <li v-for="(action, index) in briefing.recommendedActions" :key="index" class="flex items-start gap-2 text-xs font-semibold text-slate-650">
                                          <span class="w-5 h-5 rounded-full bg-slate-105 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-500 shrink-0 mt-0.5">{{ Number(index) + 1 }}</span>
                                          <span class="leading-relaxed">{{ action }}</span>
                                      </li>
                                  </ul>
                              </div>
                          </div>

                          <!-- Right: Sentiment & Project Alerts -->
                          <div class="space-y-6">
                              <!-- Sentiment Card -->
                              <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-civic space-y-4">
                                  <h3 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Constituent Sentiment</h3>
                                  <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100/50">
                                      <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider">Mood Indicator</span>
                                      <h4 class="text-2xl font-display font-black uppercase tracking-tight mt-1" :class="{
                                          'text-emerald-500': briefing.citizenSentiment === 'positive',
                                          'text-rose-500': briefing.citizenSentiment === 'negative',
                                          'text-amber-55': briefing.citizenSentiment === 'mixed',
                                          'text-slate-500': briefing.citizenSentiment === 'neutral'
                                      }">{{ briefing.citizenSentiment }}</h4>
                                  </div>
                                  <p class="text-[11px] text-slate-550 font-semibold leading-relaxed">
                                      {{ briefing.sentimentReason }}
                                  </p>
                              </div>

                              <!-- Project Alerts -->
                              <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-civic space-y-4">
                                  <h3 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Stalled Projects Alerts</h3>
                                  <div class="space-y-3">
                                      <div v-if="!briefing.projectAlerts || briefing.projectAlerts.length === 0" class="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">
                                          No alerts reported this period.
                                      </div>
                                      <div v-else v-for="(alert, index) in briefing.projectAlerts" :key="index" class="p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded text-[11px] font-semibold flex gap-2">
                                          <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                          <span>{{ alert }}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </main>
  </div>
</template>