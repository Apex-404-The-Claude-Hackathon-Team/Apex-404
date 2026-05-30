<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { FileText, Users, AlertTriangle, LayoutDashboard, BrainCircuit, Activity, BookOpen, Search, Filter, MessageSquare, CheckCircle, HardHat, Cpu } from '@lucide/vue'

definePageMeta({ middleware: 'mp' })

const auth = useAuthStore()

// Read stateful shared cookies
const reports = useCookie<any[]>('citizen_reports')
const projects = useCookie<any[]>('government_projects')

const selectedMenu = ref<'overview' | 'respond' | 'projects' | 'ai-briefs'>('overview')
const activeBriefTab = ref<'clusters' | 'hotspots' | 'sentiment'>('clusters')

// Form States
const targetReportId = ref('')
const mpResponseText = ref('')
const mpResponseStatus = ref('acknowledged')
const submittingResponse = ref(false)

const targetProjectId = ref<number | ''>('')
const projectNewStatus = ref('')
const projectNewDesc = ref('')
const submittingProject = ref(false)

// Message Banner
const notificationMsg = ref('')

// Stat Computations
const stats = computed(() => {
  const unresolved = reports.value ? reports.value.filter(r => r.status !== 'resolved').length : 0
  const ignored = reports.value ? reports.value.filter(r => r.status === 'ignored').length : 0
  const resolved = reports.value ? reports.value.filter(r => r.status === 'resolved').length : 0
  
  return [
    { title: 'Active Incidents', value: String(unresolved), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
    { title: 'Ignored Backlog', value: String(ignored), icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' },
    { title: 'AI Synthesized Wards', value: '4', icon: BrainCircuit, color: 'text-civic-blue', bg: 'bg-blue-500/10 border-blue-500/30' },
    { title: 'Resolutions Logged', value: String(resolved), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' }
  ]
})

const recentBriefs = [
  { id: 1, title: 'Synthesized Report: Liberation Road Flooding & Drainage', date: 'Oct 23, 2026', severity: 'CRITICAL', sources: 42 },
  { id: 2, title: 'Constituency Health Sector Overcrowding Analysis', date: 'Oct 20, 2026', severity: 'HIGH', sources: 18 },
  { id: 3, title: 'Public Education Zoning Deficiencies', date: 'Oct 15, 2026', severity: 'MODERATE', sources: 9 }
]

const submitMPResponse = () => {
  if (!targetReportId.value || !mpResponseText.value) return
  
  submittingResponse.value = true
  
  setTimeout(() => {
    const idx = reports.value.findIndex(r => r._id === targetReportId.value)
    if (idx !== -1) {
      if (!reports.value[idx].responses) {
        reports.value[idx].responses = []
      }
      
      reports.value[idx].responses.push({
        authorRole: 'MP Official Response',
        authorName: auth.user?.name || 'Hon. John Doe',
        body: mpResponseText.value,
        date: new Date().toISOString()
      })
      
      reports.value[idx].status = mpResponseStatus.value
      reports.value = [...reports.value]
      
      notificationMsg.value = `Response successfully posted. Citizen report status updated to "${mpResponseStatus.value}".`
      mpResponseText.value = ''
      targetReportId.value = ''
      
      setTimeout(() => { notificationMsg.value = '' }, 4000)
    }
    submittingResponse.value = false
  }, 1000)
}

const submitProjectUpdate = () => {
  if (!targetProjectId.value || !projectNewStatus.value) return
  
  submittingProject.value = true
  
  setTimeout(() => {
    const idx = projects.value.findIndex(p => p.id === Number(targetProjectId.value))
    if (idx !== -1) {
      projects.value[idx].status = projectNewStatus.value
      if (projectNewDesc.value) {
        projects.value[idx].description = projectNewDesc.value
      }
      projects.value[idx].lastUpdate = new Date().toISOString().split('T')[0]
      projects.value = [...projects.value]
      
      notificationMsg.value = `Government Project "${projects.value[idx].title}" status updated to "${projectNewStatus.value}".`
      targetProjectId.value = ''
      projectNewStatus.value = ''
      projectNewDesc.value = ''
      
      setTimeout(() => { notificationMsg.value = '' }, 4000)
    }
    submittingProject.value = false
  }, 1000)
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
                 <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Accra Central Constituency</p>
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
                              <button @click="selectedMenu = 'ai-briefs'" class="text-[9px] font-black text-civic-blue uppercase tracking-widest hover:text-slate-850 transition-colors cursor-pointer">
                                  Configure briefs
                              </button>
                          </div>
                          <div class="bg-white rounded border border-slate-200 shadow-civic overflow-hidden">
                              <div class="bg-slate-50 text-slate-500 px-6 py-4 flex items-center justify-between border-b border-slate-200">
                                  <span class="text-[9px] font-black uppercase tracking-widest">Document Brief Title</span>
                                  <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Threat Severity</span>
                              </div>
                              <div class="divide-y divide-slate-100">
                                  <div v-for="brief in recentBriefs" :key="brief.id" class="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                                      <div class="space-y-1.5">
                                          <div class="flex items-center gap-3">
                                              <span class="text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest" :class="{
                                                  'bg-rose-55 text-rose-600 border border-rose-200': brief.severity === 'CRITICAL',
                                                  'bg-amber-50 text-amber-600 border border-amber-200': brief.severity === 'HIGH',
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

                      <!-- Quick Tasks -->
                      <div class="space-y-5">
                          <h2 class="text-xs font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <Filter class="w-4.5 h-4.5 text-slate-500" /> Quick Operations
                          </h2>
                          
                          <div class="bg-white rounded border border-slate-200 shadow-civic p-6 space-y-6">
                              <div class="space-y-3 text-left">
                                  <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Pending Citizen Reports</h3>
                                  <p class="text-xs font-semibold text-slate-500 leading-normal">You have {{ reports ? reports.filter(r => r.status === 'open').length : 0 }} unacknowledged reports in your district.</p>
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
                                      <option v-for="r in reports ? reports.filter(r => r.status !== 'resolved') : []" :key="r._id" :value="r._id">
                                          [{{ r.status.toUpperCase() }}] {{ r.title }} (Endorsements: {{ r.upvoteCount }})
                                      </option>
                                  </select>
                              </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Update Issue Status <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-355 bg-slate-50 rounded transition-all">
                                      <select v-model="mpResponseStatus" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                          <option value="acknowledged">Acknowledged (Reviewing details)</option>
                                          <option value="budgeted">In Progress (Budget allocated)</option>
                                          <option value="resolved">Resolved (Fix implemented on-ground)</option>
                                          <option value="ignored">Ignored (Decline further intervention)</option>
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
                      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Publish updates to government commitments in Accra Central constituency.</p>
                  </div>

                  <div class="bg-white border border-slate-200 rounded p-8 shadow-civic">
                      <form @submit.prevent="submitProjectUpdate" class="space-y-6">
                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Active Project <span class="text-rose-500">*</span></label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <select v-model="targetProjectId" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                      <option value="" disabled selected>Select project to update...</option>
                                      <option v-for="p in projects" :key="p.id" :value="p.id">
                                          [{{ p.status.toUpperCase() }}] {{ p.title }} ({{ p.budget }})
                                      </option>
                                  </select>
                              </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">New Project Status <span class="text-rose-500">*</span></label>
                                  <div class="glow-blue-border border border-slate-355 bg-slate-50 rounded transition-all">
                                      <select v-model="projectNewStatus" required class="w-full bg-slate-50 text-slate-800 px-4 py-3.5 font-bold text-xs outline-none appearance-none cursor-pointer border-none">
                                          <option>Budgeted</option>
                                          <option>In Progress</option>
                                          <option>Completed</option>
                                          <option>Delayed</option>
                                          <option>Budget Heavy</option>
                                          <option>Under Review</option>
                                      </select>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Update Project Progress Description (Optional)</label>
                              <div class="glow-blue-border border border-slate-350 bg-slate-50 rounded transition-all">
                                  <textarea v-model="projectNewDesc" rows="4" class="w-full bg-slate-50 text-slate-800 px-4 py-3 text-xs outline-none resize-none leading-relaxed border-none" placeholder="Leave empty to keep existing description. Provide details regarding current phase..."></textarea>
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
                  <div class="border-b border-slate-200 pb-3">
                      <h2 class="text-lg font-display font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <BrainCircuit class="w-5 h-5 text-civic-blue animate-pulse" /> AI Constituency Insights & Synthesis
                      </h2>
                      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">AI-extracted community priorities, duplicate detection, and geographic breakdowns.</p>
                  </div>

                  <!-- Brief Tabs -->
                  <div class="flex border-b border-slate-200 bg-white rounded-t">
                      <button 
                        @click="activeBriefTab = 'clusters'" 
                        :class="activeBriefTab === 'clusters' ? 'border-b-2 border-civic-blue text-slate-800' : 'text-slate-500 hover:bg-slate-50'" 
                        class="flex-1 py-4 font-black uppercase tracking-widest text-[10px] focus:outline-none transition-all cursor-pointer border-none bg-transparent"
                      >
                          Issue Clustering
                      </button>
                      <button 
                        @click="activeBriefTab = 'hotspots'" 
                        :class="activeBriefTab === 'hotspots' ? 'border-b-2 border-civic-blue text-slate-800' : 'text-slate-500 hover:bg-slate-50'" 
                        class="flex-1 py-4 font-black uppercase tracking-widest text-[10px] focus:outline-none transition-all cursor-pointer border-none bg-transparent"
                      >
                          Geographic Hotspots
                      </button>
                      <button 
                        @click="activeBriefTab = 'sentiment'" 
                        :class="activeBriefTab === 'sentiment' ? 'border-b-2 border-civic-blue text-slate-800' : 'text-slate-500 hover:bg-slate-50'" 
                        class="flex-1 py-4 font-black uppercase tracking-widest text-[10px] focus:outline-none transition-all cursor-pointer border-none bg-transparent"
                      >
                          Citizen Sentiment
                      </button>
                  </div>

                  <!-- Tab 1: Issue Clustering -->
                  <div v-if="activeBriefTab === 'clusters'" class="bg-white border border-slate-200 rounded-b p-8 shadow-civic space-y-6">
                      <h3 class="text-sm font-black text-slate-800 uppercase tracking-wide">Duplicate Suppression Telemetry</h3>
                      <p class="text-xs text-slate-500 leading-relaxed font-semibold">
                          Our algorithms aggregate identical complaints within a 150-meter radius to suppress spam and redundant records.
                      </p>

                      <div class="space-y-4">
                          <div class="border border-slate-200 rounded p-5 bg-slate-50 flex items-center justify-between">
                              <div>
                                  <h4 class="font-bold text-slate-800 text-xs">Liberation Road Drainage Failure Cluster</h4>
                                  <span class="text-[9px] font-black uppercase tracking-widest text-rose-600 block mt-1.5">42 duplicated citizen files merged</span>
                              </div>
                              <span class="bg-rose-50 text-rose-600 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-rose-200">Critical Priority</span>
                          </div>
                          
                          <div class="border border-slate-200 rounded p-5 bg-slate-50 flex items-center justify-between">
                              <div>
                                  <h4 class="font-bold text-slate-800 text-xs">Nhyiaeso Electricity Fluctuation Cluster</h4>
                                  <span class="text-[9px] font-black uppercase tracking-widest text-amber-600 block mt-1.5">18 clinic/residential files merged</span>
                              </div>
                              <span class="bg-amber-50 text-amber-600 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-amber-200">High Priority</span>
                          </div>
                      </div>
                  </div>

                  <!-- Tab 2: Geographic Hotspots -->
                  <div v-if="activeBriefTab === 'hotspots'" class="bg-white border border-slate-200 rounded-b p-8 shadow-civic space-y-6">
                      <h3 class="text-sm font-black text-slate-800 uppercase tracking-wide">Electoral Ward Heat breakdown</h3>
                      <p class="text-xs text-slate-500 leading-relaxed font-semibold">
                          Analysis of active, ignored, and resolved report counts relative to individual polling districts.
                      </p>

                      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div class="border border-slate-200 p-6 rounded bg-slate-50 text-center shadow-sm relative overflow-hidden">
                              <div class="absolute top-0 left-0 right-0 h-[2px] bg-rose-500"></div>
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Atonsu Ward</span>
                              <h4 class="text-3xl font-display font-black text-slate-800 mt-2">62%</h4>
                              <p class="text-[8px] font-black text-rose-600 uppercase tracking-widest mt-1">Active Backlog</p>
                          </div>
                          <div class="border border-slate-200 p-6 rounded bg-slate-50 text-center shadow-sm relative overflow-hidden">
                              <div class="absolute top-0 left-0 right-0 h-[2px] bg-civic-blue"></div>
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nhyiaeso Ward</span>
                              <h4 class="text-3xl font-display font-black text-slate-800 mt-2">24%</h4>
                              <p class="text-[8px] font-black text-civic-blue uppercase tracking-widest mt-1">Utilities deficit</p>
                          </div>
                          <div class="border border-slate-200 p-6 rounded bg-slate-50 text-center shadow-sm relative overflow-hidden">
                              <div class="absolute top-0 left-0 right-0 h-[2px] bg-slate-450"></div>
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Santasi Ward</span>
                              <h4 class="text-3xl font-display font-black text-slate-800 mt-2">14%</h4>
                              <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Sanitation issues</p>
                          </div>
                      </div>
                  </div>

                  <!-- Tab 3: Sentiment Analysis -->
                  <div v-if="activeBriefTab === 'sentiment'" class="bg-white border border-slate-200 rounded-b p-8 shadow-civic space-y-6">
                      <h3 class="text-sm font-black text-slate-800 uppercase tracking-wide">Constituent Sentiment Metric</h3>
                      <p class="text-xs text-slate-500 leading-relaxed font-semibold">
                          Semantic synthesis analyzing citizen descriptions and comment threads to evaluate local constituent mood levels.
                      </p>

                      <div class="space-y-4">
                          <div>
                              <div class="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                  <span>Frustrated (Poor Infrastructure)</span>
                                  <span>78%</span>
                              </div>
                              <div class="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div class="h-full bg-rose-500" style="width: 78%"></div>
                              </div>
                          </div>

                          <div>
                              <div class="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                  <span>Neutral (Ongoing Commitments)</span>
                                  <span>14%</span>
                              </div>
                              <div class="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div class="h-full bg-amber-500" style="width: 14%"></div>
                              </div>
                          </div>

                          <div>
                              <div class="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                  <span>Optimistic (Resolved Education/Water)</span>
                                  <span>8%</span>
                              </div>
                              <div class="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div class="h-full bg-emerald-500" style="width: 8%"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </main>
  </div>
</template>