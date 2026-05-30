<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { ArrowLeft, MapPin, Clock, ThumbsUp, ShieldAlert, Flag, CheckCircle, Cpu, MessageSquare } from '@lucide/vue'

const auth = useAuthStore()
const route = useRoute()
const id = route.params.id

const reports = useCookie<any[]>('citizen_reports')

const reportIndex = computed(() => {
  return reports.value ? reports.value.findIndex(r => r._id === id) : -1
})

const report = computed(() => {
  if (reportIndex.value !== -1 && reports.value) {
    return reports.value[reportIndex.value]
  }
  return {
    _id: id,
    title: 'Severe Flooding Risk on Liberation Road',
    body: 'The primary drainage system near the central market has completely collapsed. With the rainy season approaching, over 50 shops are at risk of severe flooding. Previous temporary fixes by the assembly have washed away. We need concrete action, not just sandbags. The water is already beginning to pool after just 15 minutes of light rain.',
    category: 'Infrastructure & Roads',
    status: 'acknowledged',
    upvoteCount: 1450,
    createdAt: new Date().toISOString(),
    location: 'Liberation Road North, Atonsu Ward',
    author: 'Kwame A.',
    ward: 'Atonsu',
    responses: [
      {
        authorRole: 'MP Office Response',
        authorName: 'Hon. Osei Kyei-Mensah',
        body: 'My office has reviewed the attached documentation and sent engineers to the site. The district assembly has been directed to provision emergency concrete piping within the next 48 hours to mitigate the immediate risk.',
        date: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
})

const localUpvotes = ref(0)
const endorseReport = () => {
  if (reportIndex.value !== -1 && reports.value) {
    reports.value[reportIndex.value].upvoteCount++
    reports.value = [...reports.value]
  } else {
    localUpvotes.value++
  }
}

const displayUpvotes = computed(() => {
  return (report.value?.upvoteCount || 0) + localUpvotes.value
})

const comments = ref([
  { author: 'Ama Serwaa', date: new Date(Date.now() - 7200000).toISOString(), body: 'This drainage has been blocked for months. Glad to see it finally highlighted here.' },
  { author: 'Kofi Mensah', date: new Date(Date.now() - 3600000).toISOString(), body: 'If this collapses during the next heavy rain, the market will be closed for weeks. MP please act!' }
])

const newComment = ref('')

const addComment = () => {
  if (!newComment.value.trim()) return
  comments.value.push({
    author: auth.user?.name || 'Citizen User',
    date: new Date().toISOString(),
    body: newComment.value.trim()
  })
  newComment.value = ''
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<template>
    <div class="w-full bg-[#f8fafc] min-h-screen pb-24">
        
        <!-- Briefing Header with Unsplash background photo -->
        <div class="relative pt-16 pb-24 px-6 border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=80')">
            <!-- Dark overlay for text readability -->
            <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
            <div class="absolute top-[10%] right-[10%] w-72 h-72 bg-civic-blue/5 rounded-full filter blur-3xl pointer-events-none animate-pulse z-0"></div>
            
            <div class="container mx-auto px-6 lg:px-12 relative z-10">
                <NuxtLink to="/" class="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors mb-6">
                    <ArrowLeft class="w-4 h-4 text-civic-gold"/> Back to Directory
                </NuxtLink>
                
                <div class="flex flex-wrap items-center gap-3.5 mb-4">
                    <span class="bg-[#0f1524] text-civic-blue px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-civic-blue/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]">{{ report.category }}</span>
                    <span class="bg-amber-500/10 border border-amber-500/25 text-civic-gold px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                        <Flag class="w-3 h-3 animate-pulse"/> {{ report.status }}
                    </span>
                    <span class="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                        <Clock class="w-3.5 h-3.5 text-slate-500"/> {{ formatDate(report.createdAt) }}
                    </span>
                </div>
                
                <h1 class="text-3xl md:text-5xl font-display font-black text-white leading-tight mb-4 uppercase tracking-tight">
                    {{ report.title }}
                </h1>
                
                <div class="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <MapPin class="w-4 h-4 text-civic-blue" /> {{ report.location }}
                </div>
            </div>
        </div>

        <div class="container mx-auto px-6 lg:px-12 mt-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- Brief Content Area (8 Cols) -->
                <div class="lg:col-span-8 space-y-8">
                    <!-- Main Body Card -->
                    <div class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden">
                        <div class="p-8">
                            <div class="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded bg-[#0f1524] text-white flex items-center justify-center font-black border border-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                                        {{ report.author.charAt(0).toUpperCase() }}
                                    </div>
                                    <div>
                                        <p class="text-xs font-black text-civic-navy uppercase tracking-wider">{{ report.author }}</p>
                                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Resident</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 bg-rose-50/50 border border-rose-100 rounded px-3 py-1.5 shadow-sm">
                                    <ShieldAlert class="w-4 h-4 text-rose-500 animate-pulse"/>
                                    <span class="text-[9px] font-black text-rose-600 uppercase tracking-widest">Priority Issue</span>
                                </div>
                            </div>
                            
                            <p class="text-base text-slate-650 font-semibold leading-relaxed mb-8">
                                {{ report.body }}
                            </p>
                            
                            <!-- Action Box -->
                            <div class="bg-slate-50 border border-slate-200 rounded p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <p class="text-xs font-black text-[#0f1524] uppercase tracking-wider mb-0.5">Has this issue affected your community?</p>
                                    <p class="text-[11px] text-slate-500 font-semibold leading-snug">Add your endorsement to escalate this briefing report to assembly planners.</p>
                                </div>
                                <button @click="endorseReport" class="w-full sm:w-auto bg-white border border-civic-gold text-civic-gold hover:bg-civic-gold hover:text-white rounded px-6 py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow">
                                    <ThumbsUp class="w-4 h-4" /> Endorse Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Official responses section -->
                    <div v-if="report.responses && report.responses.length" class="space-y-6">
                        <div class="flex items-center gap-3 pl-2">
                            <CheckCircle class="w-5 h-5 text-emerald-500" />
                            <h2 class="text-xs font-display font-black text-civic-navy uppercase tracking-wider">Official Office Interventions</h2>
                        </div>
                        
                        <div class="space-y-4">
                            <div v-for="(resp, i) in report.responses" :key="i" class="bg-white rounded-lg shadow-civic border-l-4 border-l-civic-blue p-6 border-y border-y-slate-200 border-r border-r-slate-200">
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <p class="text-xs font-black text-civic-navy uppercase tracking-wider leading-snug">{{ resp.authorName }}</p>
                                        <p class="text-[9px] font-black text-civic-blue uppercase tracking-widest mt-0.5">{{ resp.authorRole }}</p>
                                    </div>
                                    <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock class="w-3.5 h-3.5 text-slate-300"/> {{ formatDate(resp.date) }}
                                    </span>
                                </div>
                                <p class="text-xs text-slate-650 font-semibold leading-relaxed">
                                    {{ resp.body }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Bubble Discussion Thread -->
                    <div class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden">
                        <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <MessageSquare class="w-4.5 h-4.5 text-civic-blue" />
                            <h3 class="text-xs font-display font-black text-civic-navy uppercase tracking-wider">Citizen Discussion Board</h3>
                        </div>
                        
                        <!-- Comment input -->
                        <div class="p-6 border-b border-slate-100 flex gap-4">
                            <div class="w-10 h-10 rounded bg-civic-navy text-white flex items-center justify-center font-black border border-white/5 shadow shrink-0">
                                {{ auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'C' }}
                            </div>
                            <div class="flex-1">
                                <div class="glow-blue-border border border-slate-300 transition-all rounded">
                                    <textarea v-model="newComment" placeholder="Write a supportive comment or add details..." rows="3" class="w-full bg-white px-4 py-3 text-slate-700 outline-none resize-none leading-relaxed text-xs"></textarea>
                                </div>
                                <div class="flex justify-end mt-2">
                                    <button @click="addComment" class="bg-civic-navy hover:bg-civic-navy-dark text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors rounded cursor-pointer">Post Comment</button>
                                </div>
                            </div>
                        </div>

                        <!-- Chat thread list -->
                        <div class="p-6 divide-y divide-slate-100 space-y-6">
                            <div v-for="(comment, index) in comments" :key="index" class="flex gap-4 pt-4 first:pt-0">
                                <div class="w-10 h-10 rounded bg-[#0f1524]/5 text-slate-600 flex items-center justify-center font-black border border-slate-200 shrink-0">
                                    {{ comment.author.charAt(0).toUpperCase() }}
                                </div>
                                <div class="flex-1 bg-slate-50/50 p-4 rounded border border-slate-100 relative">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="text-[10px] font-black text-[#0f1524] uppercase tracking-wider leading-none">{{ comment.author }}</h4>
                                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{{ formatDate(comment.date) }}</span>
                                    </div>
                                    <p class="text-xs text-slate-500 font-semibold leading-relaxed">{{ comment.body }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar (4 Cols) -->
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-white rounded-lg shadow-civic border border-slate-200 p-6 text-center relative overflow-hidden">
                        <div class="absolute top-0 left-0 right-0 h-[3px] bg-civic-blue"></div>
                        <span class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Community Endorsements</span>
                        <div class="text-5xl font-display font-black text-civic-navy mb-2 tracking-tight">{{ displayUpvotes.toLocaleString() }}</div>
                        <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified backing signatures</span>
                    </div>
                    
                    <div class="bg-civic-navy-dark text-white rounded-lg shadow-2xl border border-white/5 p-6 grid-bg">
                        <h3 class="text-xs font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">Share Citizen Brief</h3>
                        <div class="flex gap-2">
                            <button class="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 rounded text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer">Copy URL</button>
                            <button class="flex-1 bg-civic-blue hover:bg-civic-blue-hover text-white py-2.5 rounded text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer">Twitter / X</button>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
</template>