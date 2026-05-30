<script setup lang="ts">
import { ref, computed } from 'vue'
import { HardHat, Activity, Clock, CheckCircle2, AlertTriangle, AlertOctagon, RefreshCw, Cpu, MapPin } from '@lucide/vue'


const defaultProjects = [
  {
    id: 1,
    title: 'Central Drainage Overhaul',
    category: 'Infrastructure & Roads',
    status: 'In Progress',
    budget: '2.4B GHS',
    ward: 'Atonsu',
    lastUpdate: '2026-05-20',
    description: 'Complete overhaul of the primary drainage systems to prevent seasonal flooding.'
  },
  {
    id: 2,
    title: 'Nhyiaeso STEM High School',
    category: 'Education & Schools',
    status: 'Budgeted',
    budget: '850M GHS',
    ward: 'Nhyiaeso',
    lastUpdate: '2026-04-15',
    description: 'Construction of a state-of-the-art STEM focused high school.'
  },
  {
    id: 3,
    title: 'Market Water Sanitation',
    category: 'Water & Utilities',
    status: 'Delayed',
    budget: '120M GHS',
    ward: 'Santasi',
    lastUpdate: '2026-05-10',
    description: 'Installation of automated boreholes and public latrines in the main market.'
  },
  {
    id: 4,
    title: 'Grid Electrification Expansion',
    category: 'Water & Utilities',
    status: 'Completed',
    budget: '450M GHS',
    ward: 'Dakodwom',
    lastUpdate: '2026-03-05',
    description: 'Extension of the national grid to newly developed zones.'
  }
]

const projects = useCookie<any[]>('government_projects', { default: () => defaultProjects })

const searchQuery = ref('')
const selectedStatus = ref('all')

const filteredProjects = computed(() => {
  let list = [...projects.value]
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
  
  if (selectedStatus.value !== 'all') {
    list = list.filter(p => p.status === selectedStatus.value)
  }
  
  return list
})

const statusColors = (status: string) => {
  switch (status) {
    case 'In Progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/30 shadow-[0_0_8px_rgba(43,108,176,0.15)]'
    case 'Budgeted': return 'text-slate-500 bg-slate-500/10 border-slate-500/30'
    case 'Completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
    case 'Delayed': return 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
    case 'Budget Heavy': return 'text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] animate-pulse'
    case 'Under Review': return 'text-purple-500 bg-purple-500/10 border-purple-500/30'
    default: return 'text-slate-500 bg-slate-100 border-slate-200'
  }
}

const statusIcons = (status: string) => {
  switch (status) {
    case 'In Progress': return Activity
    case 'Budgeted': return Clock
    case 'Completed': return CheckCircle2
    case 'Delayed': return AlertTriangle
    case 'Budget Heavy': return AlertOctagon
    case 'Under Review': return RefreshCw
    default: return HardHat
  }
}

// Simulated Completion progress percentage
const getProgressPercent = (status: string) => {
  switch (status) {
    case 'Completed': return 100
    case 'In Progress': return 65
    case 'Under Review': return 35
    case 'Delayed': return 45
    case 'Budget Heavy': return 80
    case 'Budgeted': return 10
    default: return 0
  }
}
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen pb-24">
      
      <!-- Premium Dark Header with Unsplash background photo -->
      <div class="relative pt-16 pb-28 px-6 border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80')">
          <!-- Dark overlay for text readability -->
          <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
          <div class="absolute top-[15%] left-[20%] w-80 h-80 bg-civic-blue/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div class="container mx-auto px-6 lg:px-12 flex flex-col justify-between items-start gap-6 relative z-10">
              <div class="flex items-center gap-3.5 mb-6">
                  <div class="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center p-2 shadow-inner">
                      <Cpu class="w-6 h-6 text-civic-gold animate-pulse" />
                  </div>
                  <h1 class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                      Track Local Projects
                  </h1>
              </div>
              <p class="text-slate-400 font-semibold text-base max-w-2xl border-l-4 border-civic-blue pl-4 leading-relaxed">
                  Track building, road, and water projects in your area. Check progress and see how development funds are being utilized.
              </p>
          </div>
      </div>

      <div class="container mx-auto px-6 lg:px-12 -mt-16 relative z-20">
          <UiCard class="bg-white border-slate-200 p-0 relative shadow-civic overflow-hidden rounded-lg">
              
              <!-- Filter Bar with Glowing Input borders -->
              <div class="p-8 border-b border-slate-200/80 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 rounded-t-lg">
                  <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <div class="glow-blue-border border border-slate-300 transition-all rounded bg-white w-full sm:w-72">
                          <input v-model="searchQuery" placeholder="Search Projects..." class="w-full bg-white px-4 py-2.5 font-bold text-xs text-civic-navy outline-none" />
                      </div>
                      <div class="glow-blue-border border border-slate-300 transition-all rounded bg-white w-full sm:w-52">
                          <select v-model="selectedStatus" class="w-full bg-white px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-650 outline-none appearance-none cursor-pointer">
                              <option value="all">All Statuses</option>
                              <option>Budgeted</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                              <option>Delayed</option>
                              <option>Budget Heavy</option>
                              <option>Under Review</option>
                          </select>
                      </div>
                  </div>
                  <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 md:mt-0">
                      Showing {{ filteredProjects.length }} of {{ projects.length }} Projects
                  </div>
              </div>
              
              <!-- Projects Matrix List -->
              <div class="divide-y divide-slate-100">
                  <div v-if="filteredProjects.length === 0" class="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No projects found matching your search.
                  </div>
                  <div v-for="project in filteredProjects" :key="project.id" class="p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 hover:bg-[#fcfdfe] transition-all duration-300">
                      
                      <div class="flex-1 space-y-4">
                          <div class="flex items-center gap-2.5 flex-wrap">
                              <span :class="statusColors(project.status)" class="flex items-center gap-1 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border rounded">
                                  <component :is="statusIcons(project.status)" class="w-3 h-3" />
                                  {{ project.status }}
                              </span>
                              <span class="text-[8px] font-black uppercase tracking-widest text-civic-navy bg-[#0f1524]/5 border border-slate-200 px-2.5 py-1 rounded">
                                  {{ project.category }}
                              </span>
                          </div>
                          
                          <h3 class="text-xl font-bold font-display text-civic-navy uppercase tracking-tight leading-tight">
                              {{ project.title }}
                          </h3>
                          <p class="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
                              {{ project.description }}
                          </p>
                          
                          <!-- Progress Bar -->
                          <div class="w-full max-w-lg space-y-1.5 pt-2">
                              <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Simulated Progress</span>
                                  <span>{{ getProgressPercent(project.status) }}%</span>
                              </div>
                              <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div 
                                    class="h-full rounded-full transition-all duration-500" 
                                    :class="{
                                      'bg-gradient-to-r from-slate-300 to-blue-500': project.status === 'In Progress',
                                      'bg-gradient-to-r from-slate-300 to-emerald-500': project.status === 'Completed',
                                      'bg-gradient-to-r from-slate-300 to-amber-500': project.status === 'Delayed',
                                      'bg-gradient-to-r from-slate-300 to-rose-500 animate-pulse': project.status === 'Budget Heavy',
                                      'bg-slate-300': project.status === 'Budgeted',
                                      'bg-gradient-to-r from-slate-300 to-purple-500': project.status === 'Under Review'
                                    }"
                                    :style="`width: ${getProgressPercent(project.status)}%`"
                                  ></div>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Project Metrics values -->
                      <div class="flex flex-wrap gap-10 xl:border-l border-slate-200 xl:pl-8 mt-6 xl:mt-0 text-left shrink-0">
                          <div>
                              <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin class="w-3 h-3 text-slate-300"/> Location</span>
                              <span class="text-civic-navy font-black text-xs uppercase tracking-wide">{{ project.ward }} Ward</span>
                          </div>
                          <div>
                              <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Allocation</span>
                              <span class="text-civic-navy font-black text-xs uppercase tracking-wide">{{ project.budget }}</span>
                          </div>
                          <div>
                              <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</span>
                              <span class="text-civic-navy font-black text-xs uppercase tracking-wide">{{ new Date(project.lastUpdate).toLocaleDateString() }}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </UiCard>
      </div>
  </div>
</template>