<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPin, Flame, Cpu, ShieldAlert, CheckCircle } from '@lucide/vue'

const props = defineProps({
  reports: {
    type: Array as () => any[],
    default: () => []
  }
})

const selectedWard = ref<string | null>(null)
const selectedPin = ref<any | null>(null)
const showHeatmap = ref(false)

const pins = computed(() => {
  return props.reports.map((report, idx) => {
    let x = 100
    let y = 100
    if (report._id === '1') { x = 120; y = 130 }
    else if (report._id === '2') { x = 240; y = 110 }
    else if (report._id === '3') { x = 160; y = 210 }
    else {
      x = 50 + ((idx * 83) % 300)
      y = 60 + ((idx * 57) % 200)
    }

    let color = 'bg-slate-700 border-slate-500'
    let hex = '#94a3b8'
    let statusLabel = 'open'
    if (report.status === 'open') {
      color = 'bg-rose-500/20 border-rose-500'
      hex = '#f43f5e'
      statusLabel = 'Urgent'
    } else if (report.status === 'acknowledged') {
      color = 'bg-amber-500/20 border-amber-500'
      hex = '#f59e0b'
      statusLabel = 'Acknowledged'
    } else if (report.status === 'budgeted' || report.status === 'in_progress') {
      color = 'bg-blue-500/20 border-blue-500'
      hex = '#2b6cb0'
      statusLabel = 'In Progress'
    } else if (report.status === 'resolved') {
      color = 'bg-emerald-500/20 border-emerald-500'
      hex = '#10b981'
      statusLabel = 'Resolved'
    } else if (report.status === 'ignored') {
      color = 'bg-slate-500/20 border-slate-400'
      hex = '#64748b'
      statusLabel = 'Ignored'
    }

    return {
      ...report,
      x,
      y,
      color,
      hex,
      statusLabel
    }
  })
})

const selectWard = (wardName: string) => {
  if (selectedWard.value === wardName) {
    selectedWard.value = null
  } else {
    selectedWard.value = wardName
    selectedPin.value = null
  }
}

const selectPin = (pin: any) => {
  selectedPin.value = pin
}
</script>

<template>
  <div class="bg-[#0b0f19] rounded-lg border border-white/5 overflow-hidden flex flex-col h-full relative shadow-2xl">
    
    <!-- Top Glowing Border Line -->
    <div class="h-[2px] bg-gradient-to-r from-civic-blue to-civic-gold w-full"></div>

    <!-- Header Controls -->
    <div class="p-5 bg-[#0e1424] border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h3 class="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu class="w-4.5 h-4.5 text-civic-blue animate-pulse" /> Geolocation Radar Map
        </h3>
        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">District: Accra Central Operations</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="showHeatmap = !showHeatmap"
          :class="showHeatmap ? 'bg-rose-500 text-white border-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'"
          class="flex items-center gap-1.5 px-3 py-1.5 border rounded-none font-bold uppercase text-[9px] tracking-widest transition-all focus:outline-none cursor-pointer"
        >
          <Flame class="w-3 h-3" :class="showHeatmap ? 'animate-pulse' : ''" /> 
          Heatmap
        </button>
      </div>
    </div>

    <!-- Map Canvas with dark grid background -->
    <div class="relative flex-1 bg-[#070a13] grid-bg-dark min-h-[350px] flex items-center justify-center p-6 select-none overflow-hidden border-b border-white/5">
      
      <!-- Scanlines overlay for terminal feel -->
      <div class="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.15)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.02),_rgba(0,255,0,0.01),_rgba(0,0,255,0.02))] bg-[size:100%_4px,_6px_100%]"></div>

      <!-- Heatmap Density Layers -->
      <div v-if="showHeatmap" class="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500">
        <div class="absolute top-[35%] left-[28%] w-44 h-44 bg-rose-500/20 rounded-full filter blur-2xl animate-pulse"></div>
        <div class="absolute top-[50%] left-[55%] w-48 h-48 bg-amber-500/15 rounded-full filter blur-3xl"></div>
        <div class="absolute top-[25%] left-[65%] w-32 h-32 bg-civic-blue/15 rounded-full filter blur-2xl animate-pulse"></div>
      </div>

      <!-- Vector SVG Map Wards (Dark Cyber Grid Style) -->
      <svg viewBox="0 0 400 300" class="w-full max-w-[420px] drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] z-0">
        <!-- Atonsu Ward (Top Left) -->
        <path 
          d="M 20 20 L 220 20 L 180 140 L 20 140 Z" 
          :fill="selectedWard === 'Atonsu' ? 'rgba(43,108,176,0.06)' : 'rgba(15,21,36,0.5)'" 
          :stroke="selectedWard === 'Atonsu' ? '#2b6cb0' : '#1e293b'" 
          stroke-width="1.5" 
          class="transition-all cursor-pointer hover:fill-slate-800/40"
          @click="selectWard('Atonsu')"
        />
        <text x="60" y="70" class="text-[9px] font-black uppercase tracking-widest fill-slate-600 pointer-events-none">Atonsu Ward</text>

        <!-- Nhyiaeso Ward (Top Right) -->
        <path 
          d="M 220 20 L 380 20 L 380 150 L 180 140 Z" 
          :fill="selectedWard === 'Nhyiaeso' ? 'rgba(43,108,176,0.06)' : 'rgba(15,21,36,0.5)'" 
          :stroke="selectedWard === 'Nhyiaeso' ? '#2b6cb0' : '#1e293b'" 
          stroke-width="1.5" 
          class="transition-all cursor-pointer hover:fill-slate-800/40"
          @click="selectWard('Nhyiaeso')"
        />
        <text x="260" y="70" class="text-[9px] font-black uppercase tracking-widest fill-slate-600 pointer-events-none">Nhyiaeso Ward</text>

        <!-- Santasi Ward (Bottom Left) -->
        <path 
          d="M 20 140 L 180 140 L 150 280 L 20 280 Z" 
          :fill="selectedWard === 'Santasi' ? 'rgba(43,108,176,0.06)' : 'rgba(15,21,36,0.5)'" 
          :stroke="selectedWard === 'Santasi' ? '#2b6cb0' : '#1e293b'" 
          stroke-width="1.5" 
          class="transition-all cursor-pointer hover:fill-slate-800/40"
          @click="selectWard('Santasi')"
        />
        <text x="50" y="220" class="text-[9px] font-black uppercase tracking-widest fill-slate-600 pointer-events-none">Santasi Ward</text>

        <!-- Dakodwom Ward (Bottom Right) -->
        <path 
          d="M 180 140 L 380 150 L 340 280 L 150 280 Z" 
          :fill="selectedWard === 'Dakodwom' ? 'rgba(43,108,176,0.06)' : 'rgba(15,21,36,0.5)'" 
          :stroke="selectedWard === 'Dakodwom' ? '#2b6cb0' : '#1e293b'" 
          stroke-width="1.5" 
          class="transition-all cursor-pointer hover:fill-slate-800/40"
          @click="selectWard('Dakodwom')"
        />
        <text x="220" y="220" class="text-[9px] font-black uppercase tracking-widest fill-slate-600 pointer-events-none">Dakodwom Ward</text>
      </svg>

      <!-- Clickable Radar Concentric Pulse Pins -->
      <div 
        v-for="pin in pins" 
        :key="pin._id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all hover:scale-125"
        :style="`left: ${pin.x}%; top: ${pin.y}%;`"
        @click="selectPin(pin)"
      >
        <div class="relative w-8 h-8 flex items-center justify-center">
          <!-- Pulse ring animation -->
          <span 
            class="absolute -inset-1 rounded-full animate-ping opacity-60" 
            :style="`background-color: ${pin.hex}`"
          ></span>
          
          <!-- Cyber pin body -->
          <div 
            class="w-6 h-6 rounded-full border-2 bg-[#0c1220] flex items-center justify-center shadow-lg transition-colors"
            :style="`border-color: ${pin.hex}; box-shadow: 0 0 12px ${pin.hex}60`"
          >
            <!-- Solid center dot -->
            <span class="w-2 h-2 rounded-full" :style="`background-color: ${pin.hex}`"></span>
          </div>
        </div>
      </div>

      <!-- Dark Glass Tooltip Overlay -->
      <div v-if="selectedPin" class="absolute bottom-4 left-4 right-4 glass-panel-dark p-4 rounded border-l-4 border-civic-gold shadow-2xl z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="bg-white/10 text-white/95 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/5">{{ selectedPin.statusLabel }}</span>
            <span class="text-civic-gold text-[9px] font-black uppercase tracking-widest">{{ selectedPin.category }}</span>
          </div>
          <h4 class="text-sm font-bold font-display text-white leading-tight line-clamp-1">{{ selectedPin.title }}</h4>
          <p class="text-[10px] text-slate-400 mt-1 leading-snug font-semibold line-clamp-1">{{ selectedPin.location }} &bull; {{ selectedPin.upvoteCount }} Backed</p>
        </div>
        <div class="flex gap-2 self-stretch md:self-auto shrink-0 justify-end">
          <NuxtLink :to="`/reports/${selectedPin._id}`" class="bg-civic-blue hover:bg-civic-blue-hover text-white px-3.5 py-2 text-[9px] font-black uppercase tracking-widest rounded transition-colors shadow-lg shadow-civic-blue/20">
            Details
          </NuxtLink>
          <button @click="selectedPin = null" class="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded border border-white/10 transition-colors">
            Close
          </button>
        </div>
      </div>

      <!-- Ward Selected Overlay -->
      <div v-if="selectedWard && !selectedPin" class="absolute bottom-4 left-4 right-4 glass-panel-dark p-4 rounded border-l-4 border-civic-blue shadow-2xl z-30 flex justify-between items-center gap-4">
        <div>
          <h4 class="text-xs font-black text-white uppercase tracking-wider">Filtered: {{ selectedWard }} Ward</h4>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Isolating localized feed reports in the grid.</p>
        </div>
        <button @click="selectedWard = null" class="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded border border-white/10 transition-colors">
          Clear Focus
        </button>
      </div>
    </div>

    <!-- Footer Legend -->
    <div class="p-4 bg-[#0e1424] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">
      <div class="flex items-center justify-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span> Urgent</div>
      <div class="flex items-center justify-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span> Acknowledged</div>
      <div class="flex items-center justify-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#2b6cb0]"></span> In Progress</div>
      <div class="flex items-center justify-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> Resolved</div>
    </div>
  </div>
</template>
