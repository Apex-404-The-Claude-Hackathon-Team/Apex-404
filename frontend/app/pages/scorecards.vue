<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { LineChart, CheckCircle, AlertTriangle, MessageSquare, Award, Users } from '@lucide/vue'

const { $api } = useNuxtApp() as any
const auth = useAuthStore()

const constituency = computed(() => auth.user?.constituency ?? null)

const { data: dashboardData, pending } = await useAsyncData('scorecard-dashboard', async () => {
  if (!constituency.value) return null
  const [dashboard, mpRes] = await Promise.all([
    $api(`/api/dashboard/${constituency.value}`).catch(() => null),
    $api(`/api/mp/${constituency.value}`).catch(() => null),
  ])
  return { dashboard, mpProfile: mpRes?.profile ?? null }
})

const mp         = computed(() => dashboardData.value?.dashboard?.mp ?? null)
const mpProfile  = computed(() => dashboardData.value?.mpProfile ?? null)
const stats      = computed(() => dashboardData.value?.dashboard?.reportStats ?? null)

const responseRate   = computed(() => stats.value?.responseRate   ?? 0)
const resolutionRate = computed(() => stats.value?.resolutionRate ?? 0)
const ignoredRate    = computed(() => {
  const total   = stats.value?.total        ?? 0
  const ignored = stats.value?.ignoredCount ?? 0
  return total > 0 ? Math.round((ignored / total) * 100) : 0
})

const overallScore = computed(() =>
  Math.round(resolutionRate.value * 0.5 + responseRate.value * 0.3 + (100 - ignoredRate.value) * 0.2)
)

const perf = computed(() => {
  const s = overallScore.value
  if (s >= 80) return { label: 'Excellent',          textClass: 'text-emerald-500', bgClass: 'bg-emerald-500' }
  if (s >= 60) return { label: 'Satisfactory',        textClass: 'text-amber-500',   bgClass: 'bg-amber-500'   }
  return              { label: 'Needs Improvement',   textClass: 'text-rose-500',    bgClass: 'bg-rose-500'    }
})

const mpName   = computed(() => mp.value ? `${mp.value.firstName} ${mp.value.lastName}` : '—')
const party    = computed(() => mpProfile.value?.party ?? '—')
const avatarUrl = computed(() =>
  mpProfile.value?.profilePhoto?.url ??
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80'
)

// SVG circle chart helpers
const R           = 45
const CIRCUMFERENCE = 2 * Math.PI * R
const dashOffset  = (pct: number) => CIRCUMFERENCE * (1 - Math.min(pct, 100) / 100)
</script>

<template>
  <div class="w-full bg-[#f8fafc] min-h-screen pb-24">

    <!-- Header -->
    <div class="relative pt-16 pb-28 px-6 border-b border-white/5 bg-cover bg-center"
         style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80')">
      <div class="absolute inset-0 bg-slate-950/75 z-0"></div>
      <div class="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center">
              <LineChart class="w-6 h-6 text-civic-blue animate-pulse" />
            </div>
            <h1 class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
              MP Scorecard
            </h1>
          </div>
          <p class="text-slate-400 font-semibold text-base max-w-2xl border-l-4 border-civic-gold pl-4 leading-relaxed">
            Live accountability data for your constituency's Member of Parliament.
          </p>
        </div>
        <div class="bg-[#0f1524] border border-white/5 p-5 rounded min-w-[200px] shadow-xl text-left">
          <span class="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Active Rating Period</span>
          <p class="text-xl font-black text-white tracking-widest">Q4 2026</p>
          <span class="text-[10px] text-civic-blue font-bold mt-1.5 block">Next update in 14 days</span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-6 lg:px-12 -mt-16 relative z-20 space-y-6">

      <!-- No constituency state -->
      <div v-if="!constituency" class="bg-white rounded-xl shadow-civic border border-slate-200 p-16 text-center">
        <Users class="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 class="text-lg font-display font-black text-slate-700 uppercase tracking-wide mb-2">No Constituency Linked</h2>
        <p class="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
          Log in or complete your profile to see your MP's scorecard.
        </p>
        <NuxtLink to="/login" class="inline-block mt-6 bg-[#0f1524] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded transition-colors hover:bg-black">
          Log In
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-else-if="pending" class="bg-white rounded-xl shadow-civic border border-slate-200 p-16 text-center">
        <UiLoadingSpinner size="lg" />
      </div>

      <template v-else>
        <!-- MP Profile Card -->
        <div class="bg-white rounded-xl shadow-civic border border-slate-200 overflow-hidden">
          <div class="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img :src="avatarUrl" :alt="mpName"
                 class="w-20 h-20 rounded-full border-2 border-slate-200 object-cover shadow-md shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-1">
                <h2 class="text-2xl font-display font-black text-slate-900 uppercase leading-none">
                  {{ mp ? `Hon. ${mpName}` : 'MP Not Registered' }}
                </h2>
                <span v-if="party !== '—'"
                      class="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border"
                      :class="party === 'NPP' ? 'bg-blue-50 text-blue-700 border-blue-200' : party === 'NDC' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'">
                  {{ party }}
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">{{ constituency }} Constituency</p>
              <p v-if="mpProfile?.bio" class="text-xs text-slate-500 font-semibold mt-2 max-w-xl leading-relaxed">{{ mpProfile.bio }}</p>
            </div>
            <!-- Overall Score Badge -->
            <div class="shrink-0 text-center bg-slate-50 border border-slate-100 rounded-xl p-5 min-w-[110px]">
              <span class="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Overall Score</span>
              <span class="text-4xl font-display font-black leading-none" :class="perf.textClass">{{ overallScore }}</span>
              <span class="text-xs font-bold text-slate-400">/100</span>
              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :class="perf.bgClass" :style="`width: ${overallScore}%`"></div>
              </div>
              <span class="block text-[9px] font-black uppercase tracking-widest mt-2" :class="perf.textClass">{{ perf.label }}</span>
            </div>
          </div>
          <div v-if="stats" class="border-t border-slate-100 px-8 py-4 bg-slate-50 flex flex-wrap gap-6 text-xs font-semibold text-slate-500">
            <span><span class="font-black text-slate-800">{{ stats.total }}</span> Total Reports</span>
            <span><span class="font-black text-emerald-600">{{ stats.byStatus?.resolved ?? 0 }}</span> Resolved</span>
            <span><span class="font-black text-amber-600">{{ stats.byStatus?.under_review ?? 0 }}</span> Under Review</span>
            <span><span class="font-black text-rose-600">{{ stats.ignoredCount ?? 0 }}</span> Ignored</span>
            <span><span class="font-black text-slate-800">{{ stats.byStatus?.pending ?? 0 }}</span> Pending</span>
          </div>
        </div>

        <!-- Circle Charts -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Response Rate -->
          <div class="bg-white rounded-xl shadow-civic border border-slate-200 p-8 flex flex-col items-center text-center">
            <div class="flex items-center gap-2 mb-6 self-start">
              <MessageSquare class="w-4 h-4 text-civic-blue" />
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Response Rate</span>
            </div>
            <svg width="120" height="120" viewBox="0 0 120 120" class="-rotate-90">
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#e2e8f0" stroke-width="10" />
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#2b6cb0" stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="CIRCUMFERENCE"
                      :stroke-dashoffset="dashOffset(responseRate)"
                      class="transition-all duration-700" />
            </svg>
            <span class="text-4xl font-display font-black text-civic-blue -mt-2">{{ responseRate }}<span class="text-xl">%</span></span>
            <p class="text-[10px] font-semibold text-slate-400 mt-2 max-w-[160px] leading-relaxed">
              Percentage of reports where the MP or office took action
            </p>
          </div>

          <!-- Resolution Rate -->
          <div class="bg-white rounded-xl shadow-civic border border-slate-200 p-8 flex flex-col items-center text-center">
            <div class="flex items-center gap-2 mb-6 self-start">
              <CheckCircle class="w-4 h-4 text-emerald-500" />
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Resolution Rate</span>
            </div>
            <svg width="120" height="120" viewBox="0 0 120 120" class="-rotate-90">
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#e2e8f0" stroke-width="10" />
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#10b981" stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="CIRCUMFERENCE"
                      :stroke-dashoffset="dashOffset(resolutionRate)"
                      class="transition-all duration-700" />
            </svg>
            <span class="text-4xl font-display font-black text-emerald-500 -mt-2">{{ resolutionRate }}<span class="text-xl">%</span></span>
            <p class="text-[10px] font-semibold text-slate-400 mt-2 max-w-[160px] leading-relaxed">
              Percentage of community reports that were fully resolved
            </p>
          </div>

          <!-- Ignored Reports -->
          <div class="bg-white rounded-xl shadow-civic border border-slate-200 p-8 flex flex-col items-center text-center">
            <div class="flex items-center gap-2 mb-6 self-start">
              <AlertTriangle class="w-4 h-4 text-rose-500" />
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Ignored Reports</span>
            </div>
            <svg width="120" height="120" viewBox="0 0 120 120" class="-rotate-90">
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#e2e8f0" stroke-width="10" />
              <circle cx="60" cy="60" :r="R" fill="none" stroke="#f43f5e" stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="CIRCUMFERENCE"
                      :stroke-dashoffset="dashOffset(ignoredRate)"
                      class="transition-all duration-700" />
            </svg>
            <span class="text-4xl font-display font-black text-rose-500 -mt-2">{{ ignoredRate }}<span class="text-xl">%</span></span>
            <p class="text-[10px] font-semibold text-slate-400 mt-2 max-w-[160px] leading-relaxed">
              Percentage of reports marked as ignored with no response
            </p>
          </div>

        </div>

        <!-- View Full Profile link -->
        <div v-if="mp" class="text-center pt-2">
          <NuxtLink :to="`/mp/${constituency}`"
                    class="inline-flex items-center gap-2 text-xs font-black text-civic-blue hover:text-civic-navy uppercase tracking-widest transition-colors">
            <Award class="w-4 h-4" />
            View Full MP Profile &amp; Reports &rarr;
          </NuxtLink>
        </div>
      </template>

    </div>
  </div>
</template>
