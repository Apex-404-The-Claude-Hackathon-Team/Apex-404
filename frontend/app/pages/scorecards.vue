<script setup lang="ts">
import { ref } from 'vue'
import { Award, Briefcase, CheckCircle, Clock, TrendingUp, LineChart, ShieldCheck } from '@lucide/vue'

// Extremely detailed mock data
const scorecards = ref([
  {
    id: 'mp_1',
    name: 'Hon. Osei Kyei-Mensah',
    constituency: 'Suame District Assembly',
    party: 'NPP',
    score: 84.5,
    rank: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    metrics: {
      reportsResolved: 342,
      averageResponseTime: '4.2 Days',
      townHallsHeld: 12,
      budgetTransparency: 'High'
    },
    topIssues: ['Road Infrastructure', 'Market Development'],
    recentAction: 'Allocated 2.4B GHS for Central Drainage Overhaul (Verified)'
  },
  {
    id: 'mp_2',
    name: 'Hon. Samuel Okudzeto Ablakwa',
    constituency: 'North Tongu Assembly',
    party: 'NDC',
    score: 72.0,
    rank: 2,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    metrics: {
      reportsResolved: 198,
      averageResponseTime: '8.5 Days',
      townHallsHeld: 5,
      budgetTransparency: 'Medium'
    },
    topIssues: ['Sanitation', 'Education'],
    recentAction: 'Acknowledged Water Shortage Reports (Pending Action)'
  },
  {
    id: 'mp_3',
    name: 'Hon. Haruna Iddrisu',
    constituency: 'Tamale South',
    party: 'NDC',
    score: 89.2,
    rank: 3,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
    metrics: {
      reportsResolved: 412,
      averageResponseTime: '2.8 Days',
      townHallsHeld: 18,
      budgetTransparency: 'Very High'
    },
    topIssues: ['Health Facilities', 'Youth Employment'],
    recentAction: 'Commissioned 4 new localized boreholes'
  }
].sort((a, b) => b.score - a.score))

const performanceLevels = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-500', label: 'Excellent' }
    if (score >= 70) return { bg: 'bg-civic-gold', text: 'text-civic-gold', label: 'Satisfactory' }
    return { bg: 'bg-rose-500', text: 'text-rose-500', label: 'Needs Improvement' }
}
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen pb-24">
      
      <!-- Premium Dark Header with Unsplash background photo -->
      <div class="relative pt-16 pb-28 px-6 border-b border-white/5 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80')">
          <!-- Dark overlay for text readability -->
          <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
          <div class="absolute top-[10%] left-[10%] w-80 h-80 bg-civic-blue/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div class="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
              <div>
                  <div class="flex items-center gap-3 mb-6">
                      <div class="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                          <LineChart class="w-6 h-6 text-civic-blue animate-pulse" />
                      </div>
                      <h1 class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                          Check MP Ratings
                      </h1>
                  </div>
                  <p class="text-slate-400 font-semibold text-base max-w-2xl border-l-4 border-civic-gold pl-4 leading-relaxed">
                      See how fast your Member of Parliament responds to community reports and fixes problems in your neighborhood.
                  </p>
              </div>
              
              <div class="bg-[#0f1524] border border-white/5 p-5 rounded min-w-[250px] shadow-xl text-left">
                  <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Active Rating Period</span>
                  <p class="text-xl font-black text-white tracking-widest">Q4 2026</p>
                  <span class="text-[10px] text-civic-blue font-bold mt-1.5 block">Next update in 14 days</span>
              </div>
          </div>
      </div>

      <!-- Main Scoreboard -->
      <div class="container mx-auto px-6 lg:px-12 -mt-16 relative z-20">
          
          <UiCard class="bg-white rounded-lg shadow-civic border border-slate-200 overflow-hidden p-0 relative">
              <div class="p-8 border-b border-slate-200/80 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <h2 class="text-xs font-display font-black text-civic-navy uppercase tracking-wider flex items-center gap-2">
                       <Award class="w-5 h-5 text-civic-gold" /> Leaderboard Rankings
                  </h2>
                  <div class="flex gap-3 w-full max-w-sm">
                      <div class="glow-blue-border border border-slate-300 bg-white rounded flex-1">
                          <input placeholder="Search Representative..." class="w-full bg-white px-4 py-2 text-xs font-bold text-civic-navy outline-none" />
                      </div>
                      <button class="bg-[#0f1524] hover:bg-black text-white font-black uppercase tracking-widest text-[9px] px-5 py-2.5 rounded transition-colors cursor-pointer">Filter</button>
                  </div>
              </div>

              <!-- Scorecard List -->
              <div class="divide-y divide-slate-100">
                  <div v-for="(mp, index) in scorecards" :key="mp.id" class="p-8 flex flex-col xl:flex-row gap-8 hover:bg-[#fcfdfe] transition-all duration-350">
                      
                      <!-- Identifier Block -->
                       <div class="xl:w-1/4 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-200/60 pb-6 xl:pb-0 pr-0 xl:pr-8">
                           <div class="flex items-center gap-4 mb-4">
                               <div class="relative shrink-0">
                                   <img :src="mp.avatarUrl" :alt="mp.name" class="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm" />
                                   <span class="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 border border-white text-white flex items-center justify-center font-black text-[9px] shadow-sm">
                                       {{ index + 1 }}
                                   </span>
                               </div>
                               <div>
                                   <NuxtLink :to="`/constituency/${mp.id}`" class="text-lg font-display font-black text-civic-navy hover:text-civic-blue transition-colors uppercase leading-tight">
                                       {{ mp.name }}
                                   </NuxtLink>
                                   <span class="block text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{{ mp.constituency }}</span>
                               </div>
                           </div>
                          
                          <div class="mt-auto bg-slate-50 border border-slate-100 p-4 rounded text-left">
                              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Overall Rating</span>
                              <div class="flex items-end gap-1 leading-none">
                                  <span class="text-3xl font-display font-black tracking-tighter" :class="performanceLevels(mp.score).text">{{ mp.score }}</span>
                                  <span class="text-[10px] font-bold text-slate-400 mb-1">/ 100</span>
                              </div>
                              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-350">
                                  <div class="h-full rounded-full" :class="performanceLevels(mp.score).bg" :style="`width: ${mp.score}%`"></div>
                              </div>
                          </div>

                          <NuxtLink :to="`/constituency/${mp.id}`" class="mt-4 text-[9px] font-black text-civic-blue hover:text-civic-navy uppercase tracking-widest flex items-center gap-1 transition-colors">
                              Go to Dashboard &rarr;
                          </NuxtLink>
                      </div>

                      <!-- Metrics Grid -->
                      <div class="xl:w-2/4 grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 xl:pb-0 xl:border-r border-slate-200/60 pr-0 xl:pr-8 text-left">
                          <div class="p-4 border border-slate-100 rounded bg-slate-50/50">
                              <CheckCircle class="w-5 h-5 text-emerald-500 mb-3" />
                              <span class="block text-2xl font-black text-civic-navy leading-none">{{ mp.metrics.reportsResolved }}</span>
                              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1.5">Issues Resolved</span>
                          </div>
                          <div class="p-4 border border-slate-100 rounded bg-slate-50/50">
                              <Clock class="w-5 h-5 text-amber-500 mb-3" />
                              <span class="block text-lg font-black text-civic-navy leading-none mt-1">{{ mp.metrics.averageResponseTime }}</span>
                              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1.5">Avg Response</span>
                          </div>
                          <div class="p-4 border border-slate-100 rounded bg-slate-50/50">
                              <Briefcase class="w-5 h-5 text-civic-blue mb-3" />
                              <span class="block text-2xl font-black text-civic-navy leading-none">{{ mp.metrics.townHallsHeld }}</span>
                              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1.5">Town Halls</span>
                          </div>
                          <div class="p-4 border border-slate-100 rounded bg-slate-50/50">
                              <ShieldCheck class="w-5 h-5 text-indigo-500 mb-3" />
                              <span class="block text-xs font-black text-civic-navy leading-none mt-2">{{ mp.metrics.budgetTransparency }}</span>
                              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1.5">Transparency</span>
                          </div>
                      </div>

                      <!-- Context Block -->
                      <div class="xl:w-1/4 flex flex-col justify-center text-left">
                          <div class="mb-4">
                              <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority Focus Wards</span>
                              <div class="flex flex-wrap gap-1.5">
                                  <span v-for="tag in mp.topIssues" :key="tag" class="text-[8px] font-black text-civic-navy bg-[#0f1524]/5 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                                      {{ tag }}
                                  </span>
                              </div>
                          </div>
                          
                          <div class="bg-blue-50/50 border border-blue-100 p-4 rounded relative">
                              <TrendingUp class="w-3.5 h-3.5 text-civic-blue absolute top-4 right-4 animate-pulse" />
                              <span class="block text-[8px] font-black uppercase tracking-widest text-civic-blue mb-2">Latest Action</span>
                              <p class="text-xs font-semibold text-slate-700 leading-normal">{{ mp.recentAction }}</p>
                          </div>
                      </div>
                      
                  </div>
              </div>
          </UiCard>
      </div>
  </div>
</template>