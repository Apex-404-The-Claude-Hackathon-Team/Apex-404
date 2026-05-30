<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUpRight, MapPin, Building, ShieldAlert, Lightbulb, Clock, CheckCircle, ThumbsUp, ArrowRight, Flame, Cpu, Users, Eye, Mic, HardHat, Award } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import MapWidget from '~/components/ui/MapWidget.vue'

const auth = useAuthStore()
const sortBy = ref<'top' | 'recent' | 'unresolved' | 'ignored'>('top')
const selectedCategory = ref<string>('all')

const defaultReports = [
  { _id: '1', title: 'Severe Flooding Risk on Liberation Road', body: 'The primary drainage system near the central market has completely collapsed. With the rainy season approaching, over 50 shops are at risk of severe flooding. Previous temporary fixes by the assembly have washed away. Citizens report water levels rising in under 15 minutes of light rain.', category: 'Infrastructure & Roads', status: 'open', upvoteCount: 1450, createdAt: new Date().toISOString(), location: 'Liberation Road North', author: 'Kwame A.', ward: 'Atonsu' },
  { _id: '2', title: 'Unreliable Electricity to District Clinic', body: 'The power fluctuations in the past 48 hours have caused damage to the only operating cold-storage unit at the clinic. Vaccines are at risk of spoiling if an emergency generator is not provided immediately.', category: 'Water & Utilities', status: 'budgeted', upvoteCount: 980, createdAt: new Date(Date.now() - 86400000).toISOString(), location: 'District Polyclinic', author: 'Dr. Mensah', ward: 'Nhyiaeso' },
  { _id: '3', title: 'Uncollected Refuse at Transport Hub', body: 'Waste collection vehicles have failed to visit the main transport terminal for three weeks. The buildup is causing a severe health hazard to both commuters and local vendors.', category: 'Public Health & Sanitation', status: 'acknowledged', upvoteCount: 765, createdAt: new Date(Date.now() - 172800000).toISOString(), location: 'Main Lorry Station', author: 'Akosua B.', ward: 'Santasi' },
  { _id: '4', title: 'Deteriorating School Walkway and Open Potholes', body: 'The primary walking route for school children near Nhyiaeso STEM school has several deep open potholes. Swerving cars regularly brush past school children.', category: 'Infrastructure & Roads', status: 'ignored', upvoteCount: 520, createdAt: new Date(Date.now() - 604800000).toISOString(), location: 'Nhyiaeso School Road', author: 'Ama K.', ward: 'Nhyiaeso' }
]

const reports = useCookie<any[]>('citizen_reports', { default: () => defaultReports })

const categories = ['all', 'Infrastructure & Roads', 'Water & Utilities', 'Public Health & Sanitation', 'Education & Schools', 'Security & Zoning']

// Stateful Upvoting
const backIssue = (reportId: string) => {
  const index = reports.value.findIndex(r => r._id === reportId)
  if (index !== -1) {
    reports.value[index].upvoteCount++
    reports.value = [...reports.value]
  }
}

// Sorting and Filtering
const filteredReports = computed(() => {
  let list = [...reports.value]

  if (selectedCategory.value !== 'all') {
    list = list.filter(r => r.category === selectedCategory.value)
  }

  if (sortBy.value === 'top') {
    list.sort((a, b) => b.upvoteCount - a.upvoteCount)
  } else if (sortBy.value === 'recent') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy.value === 'unresolved') {
    list = list.filter(r => r.status !== 'resolved')
  } else if (sortBy.value === 'ignored') {
    list = list.filter(r => r.status === 'ignored')
  }

  return list
})

const recentNews = [
  { id: 1, title: 'Water Supply Restoration Schedule Announced', date: 'Oct 24, 2026', tag: 'Notice' },
  { id: 2, title: 'MP Holds Town Hall on Tech Hub Project', date: 'Oct 22, 2026', tag: 'Event' },
  { id: 3, title: 'Central Drainage Contract Awarded', date: 'Oct 20, 2026', tag: 'News' }
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen space-y-16 pb-24">
    
    <!-- Hero Section (Clean, official layout with Unsplash background photo) -->
    <div class="relative pt-20 pb-24 px-6 overflow-hidden border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=80')">
      <!-- Dark overlay for text readability -->
      <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
      
      <!-- Glowing Mesh Orbs -->
      <div class="absolute top-[20%] left-[10%] w-[380px] h-[380px] bg-civic-blue/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div class="absolute bottom-[10%] right-[15%] w-[320px] h-[320px] bg-civic-gold/5 rounded-full filter blur-[80px] pointer-events-none"></div>

      <div class="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center text-center space-y-8 max-w-4xl animate-fade-in-up">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-civic-blue text-[9px] font-black uppercase tracking-widest shadow-inner">
           Official Citizen Portal
        </div>
        
        <h1 class="text-4xl md:text-6xl font-display font-black tracking-tight leading-none text-white">
          SPEAK TO REPORT PROBLEMS. <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-civic-blue to-civic-gold">MAKE YOUR VOICE HEARD.</span>
        </h1>
        
        <p class="text-slate-400 font-semibold text-sm md:text-base leading-relaxed max-w-2xl">
          Report water, road, school, or trash issues instantly by speaking. We send your reports directly to your constituency office. Unresolved problems remain visible to keep representatives accountable.
        </p>

        <!-- Big Visual action buttons/cards for accessibility -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 w-full max-w-3xl">
          <NuxtLink to="/report" class="bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-all group hover:border-civic-gold/50 cursor-pointer shadow-lg hover-lift">
            <div class="w-14 h-14 rounded-full bg-civic-gold flex items-center justify-center p-3 text-civic-navy-dark shadow-lg shadow-civic-gold/20 group-hover:scale-105 transition-transform">
              <Mic class="w-7 h-7" />
            </div>
            <div>
              <h3 class="text-white font-bold text-xs uppercase tracking-wider">Speak &amp; Report</h3>
              <p class="text-slate-400 text-[11px] mt-1 leading-normal font-semibold">Click here to speak your report in Twi, English, Ewe, or Ga.</p>
            </div>
          </NuxtLink>

          <NuxtLink to="/projects" class="bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-all group hover:border-civic-blue/50 cursor-pointer shadow-lg hover-lift">
            <div class="w-14 h-14 rounded-full bg-civic-blue flex items-center justify-center p-3 text-white shadow-lg shadow-civic-blue/20 group-hover:scale-105 transition-transform">
              <HardHat class="w-7 h-7" />
            </div>
            <div>
              <h3 class="text-white font-bold text-xs uppercase tracking-wider">Track Projects</h3>
              <p class="text-slate-400 text-[11px] mt-1 leading-normal font-semibold">Click here to inspect building, road, and water projects.</p>
            </div>
          </NuxtLink>

          <NuxtLink to="/scorecards" class="bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-all group hover:border-civic-gold/50 cursor-pointer shadow-lg hover-lift">
            <div class="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center p-3 text-civic-gold shadow-lg shadow-black/20 group-hover:scale-105 transition-transform border border-white/10">
              <Award class="w-7 h-7" />
            </div>
            <div>
              <h3 class="text-white font-bold text-xs uppercase tracking-wider">MP Scorecards</h3>
              <p class="text-slate-400 text-[11px] mt-1 leading-normal font-semibold">Click here to check how active and responsive your MP is.</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Section 1: Interactive Map & Dashboard Widgets -->
    <div class="container mx-auto px-6 lg:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <!-- Interactive Map (8 Cols) -->
        <div class="lg:col-span-8">
          <MapWidget :reports="reports" />
        </div>

        <!-- Right Side: Analytics & notice widgets (4 Cols) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Recent Community Reports card -->
          <div class="bg-white rounded-lg shadow-civic border border-slate-200 p-6 relative overflow-hidden text-left">
            <div class="absolute left-0 top-0 bottom-0 w-[4px] bg-civic-blue"></div>
            <h3 class="text-[9px] font-black text-civic-blue uppercase tracking-widest flex items-center gap-2 mb-3">
              <Lightbulb class="w-4 h-4 text-civic-gold" /> Constituency Updates
            </h3>
            <p class="text-xs font-semibold text-slate-500 leading-relaxed mb-4">
              Identical community complaints are automatically combined to help assembly officers plan fixes faster. Road problems are currently the most reported issues in Atonsu Ward.
            </p>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 p-3 rounded border border-slate-100 text-center shadow-inner">
                <span class="block text-xl font-black text-civic-navy leading-none">{{ reports.filter(r => r.status !== 'resolved').length }}</span>
                <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1 block">Unresolved Problems</span>
              </div>
              <div class="bg-slate-50 p-3 rounded border border-slate-100 text-center shadow-inner">
                <span class="block text-xl font-black text-rose-600 leading-none">{{ reports.filter(r => r.status === 'ignored').length }}</span>
                <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1 block">No Action Taken</span>
              </div>
            </div>
          </div>

          <!-- Notice Board -->
          <div class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden text-left">
            <div class="p-5 border-b border-slate-100 bg-slate-50">
              <h3 class="text-xs font-display font-black text-civic-navy uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert class="w-4.5 h-4.5 text-civic-gold" /> Important Public Notices
              </h3>
            </div>
            <div class="p-0 divide-y divide-slate-100">
              <a href="#" v-for="news in recentNews" :key="news.id" class="block p-4.5 hover:bg-slate-50 transition-colors">
                <span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-civic-navy text-[8px] font-black uppercase tracking-widest mb-1.5">{{ news.tag }}</span>
                <h4 class="text-xs font-bold text-civic-navy leading-snug mb-1">{{ news.title }}</h4>
                <span class="text-[9px] font-black text-slate-400 tracking-widest uppercase">{{ news.date }}</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Section 2: Priority Citizen Feed -->
    <div class="container mx-auto px-6 lg:px-12">
      <div class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden">
        
        <!-- Feed Header -->
        <div class="bg-civic-navy px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5">
          <div>
              <h2 class="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users class="w-4 h-4 text-civic-blue" /> Recent Reports from Citizens
              </h2>
              <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Accra Central District</p>
          </div>
          
          <!-- sorting selectors -->
          <div class="flex bg-civic-navy-dark rounded-full p-1 border border-white/5 shrink-0 self-start md:self-auto">
            <button 
              v-for="tab in ['top', 'recent', 'unresolved', 'ignored'] as const"
              :key="tab"
              @click="sortBy = tab" 
              :class="sortBy === tab ? 'bg-civic-blue text-white shadow-lg' : 'text-slate-400 hover:text-white'" 
              class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              {{ tab === 'top' ? 'Most Supported' : tab === 'recent' ? 'Newest' : tab === 'unresolved' ? 'Not Fixed' : 'No Response' }}
            </button>
          </div>
        </div>

        <!-- Category Pill Filter bar -->
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

        <!-- Issues List -->
        <div class="divide-y divide-slate-100">
          <div v-if="filteredReports.length === 0" class="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            No active complaints match filters.
          </div>
          <div v-for="report in filteredReports" :key="report._id" class="p-8 flex flex-col md:flex-row gap-8 hover:bg-[#fcfdfe] transition-all duration-300">
            
            <!-- Supporters Controller -->
            <div class="md:w-28 flex flex-col items-center pb-6 md:pb-0 md:border-r border-slate-200/60 md:pr-8 shrink-0 justify-center">
              <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Supporters</span>
              <span class="bg-slate-50 text-slate-800 font-black text-2xl px-5 py-3 rounded border border-slate-200/80 min-w-full text-center mb-3 shadow-inner">{{ report.upvoteCount.toLocaleString() }}</span>
              <button 
                @click="backIssue(report._id)"
                class="w-full bg-white border border-civic-gold/50 text-civic-gold hover:bg-civic-gold hover:text-white rounded py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <ThumbsUp class="w-3 h-3" /> Support
              </button>
            </div>
            
            <!-- Content -->
            <div class="flex-1 flex flex-col justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest rounded border" 
                        :class="{
                            'bg-rose-50 border-rose-200 text-rose-600': report.status === 'open',
                            'bg-amber-50 border-amber-200 text-amber-700': report.status === 'acknowledged',
                            'bg-blue-50 border-blue-200 text-blue-700': report.status === 'budgeted' || report.status === 'in_progress',
                            'bg-slate-50 border-slate-200 text-slate-600': report.status === 'ignored',
                            'bg-emerald-50 border-emerald-200 text-emerald-700': report.status === 'resolved'
                        }">
                    {{ report.status === 'open' ? 'new' : report.status === 'acknowledged' ? 'working on it' : report.status === 'resolved' ? 'fixed' : report.status.replace('_', ' ') }}
                  </span>
                  <span class="bg-[#0f1524] text-white rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Building class="w-2.5 h-2.5 text-civic-gold"/> {{ report.category }}
                  </span>
                  <span class="bg-slate-100 text-slate-500 rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                    Ward: {{ report.ward }}
                  </span>
                </div>
                
                <NuxtLink :to="`/reports/${report._id}`" class="text-xl font-bold font-display text-civic-navy hover:text-civic-blue tracking-tight block mb-2 transition-colors leading-tight">
                  {{ report.title }}
                </NuxtLink>
                <p class="text-xs text-slate-500 font-medium leading-relaxed mb-5">{{ report.body }}</p>
              </div>
              
              <!-- Metadata footer -->
              <div class="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-auto">
                <div class="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5 text-slate-300"/> {{ report.location }}</span>
                  <span class="hidden sm:flex items-center gap-1.5"><Clock class="w-3.5 h-3.5 text-slate-300"/> {{ formatDate(report.createdAt) }}</span>
                </div>
                <NuxtLink :to="`/reports/${report._id}`" class="text-civic-blue hover:text-civic-navy font-black uppercase tracking-widest text-[9px] flex items-center gap-1">
                  Details <ArrowRight class="w-3 h-3"/>
                </NuxtLink>
              </div>
            </div>

          </div>
        </div>
        
        <div class="bg-slate-50 p-5 border-t border-slate-200 text-center">
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Accra Central Constituency Data Feed Node &bull; VoiceUp
          </span>
        </div>

      </div>
    </div>
  </div>
</template>