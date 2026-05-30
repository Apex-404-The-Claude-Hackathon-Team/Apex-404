<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { MapPin, Phone, Mail, ChevronDown, LogOut, Menu, X, Landmark, Flag, ShieldAlert, Cpu } from '@lucide/vue'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
    await auth.logout()
}

const navigateToConstituency = async (event: Event) => {
    const val = (event.target as HTMLSelectElement).value
    if (val) {
        await navigateTo(`/constituency/${val}`)
    }
}

const isDashboardActive = computed(() => {
    // Matches the dashboard '/' and any report details page under '/reports'
    return route.path === '/' || route.path.startsWith('/reports')
})

const isReportActive = computed(() => {
    // Matches the issue submission page and any potential subroutes
    return route.path.startsWith('/report')
})

const isScorecardsActive = computed(() => {
    // Matches MP scorecards listing and dynamic constituency detail pages
    return route.path.startsWith('/scorecards') || route.path.startsWith('/constituency')
})

const isProjectsActive = computed(() => {
    // Matches project tracker and any subroutes
    return route.path.startsWith('/projects')
})

const isMpActive = computed(() => {
    // Matches MP dashboard and any inner subroutes
    return route.path.startsWith('/mp')
})

const currentConstituency = computed(() => {
    if (route.path.startsWith('/constituency/')) {
        // Extract the ID from the route path or route.params
        return route.params.id || route.path.split('/').pop() || ''
    }
    return ''
})
</script>

<template>
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative">
        
        <!-- Glowing Top Stream Gradient Line -->
        <div class="h-[3px] bg-gradient-to-r from-civic-blue via-civic-gold to-civic-blue animate-gradient-flow w-full z-50 sticky top-0"></div>

        <!-- Top Utility Bar -->
        <div class="bg-[#080c14] text-slate-400 text-xs py-2 border-b border-white/5 relative z-40">
            <div class="container mx-auto px-6 lg:px-12 flex justify-between items-center">
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2 text-slate-400">
                        <MapPin class="w-3.5 h-3.5 text-civic-blue" />
                        <span class="font-bold">Constituency Node:</span>
                        <select :value="currentConstituency" @change="navigateToConstituency($event)" class="bg-transparent text-white font-bold outline-none border-none cursor-pointer text-xs focus:ring-0">
                            <option value="" disabled class="bg-[#080c14] text-slate-400">Select...</option>
                            <option value="mp_1" class="bg-[#080c14] text-white">Suame (Osei K-M)</option>
                            <option value="mp_2" class="bg-[#080c14] text-white">North Tongu (Samuel O.A)</option>
                            <option value="mp_3" class="bg-[#080c14] text-white">Tamale South (Haruna I)</option>
                        </select>
                    </div>
                    <span class="hidden md:flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><Phone class="w-3.5 h-3.5 text-civic-blue" /> Assembly Support: 112</span>
                </div>
                <div class="flex items-center gap-4">
                    <button class="flex items-center gap-1 hover:text-white transition-colors">English <ChevronDown class="w-3 h-3 text-civic-blue" /></button>
                    <div class="h-3 w-px bg-white/10"></div>
                    <button class="flex items-center gap-1 hover:text-white transition-colors">Local Translation <ChevronDown class="w-3 h-3 text-civic-gold" /></button>
                </div>
            </div>
        </div>

        <!-- Main Header with Sticky Glassmorphism -->
        <header class="sticky top-[3px] z-50 bg-[#0c1220]/90 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/20 text-white transition-all">
            <div class="container mx-auto px-6 lg:px-12 flex items-center justify-between h-[85px]">
                
                <!-- Logo Area -->
                <div class="flex items-center gap-4">
                    <NuxtLink to="/" class="flex items-center gap-3.5 group">
                       <div class="w-12 h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center p-2 group-hover:border-civic-blue/50 group-hover:shadow-[0_0_15px_rgba(43,108,176,0.3)] transition-all">
                           <Cpu class="w-6 h-6 text-civic-blue group-hover:scale-110 transition-transform" />
                       </div>
                       <div>
                           <h1 class="text-2xl font-display font-black tracking-tight text-white leading-none flex items-center gap-1">
                               Voice<span class="text-civic-gold">Up</span>
                           </h1>
                           <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1">Governance Platform</p>
                       </div>
                    </NuxtLink>
                </div>
                
                <!-- Desktop Navigation -->
                <nav class="hidden lg:flex items-center gap-1">
                    <NuxtLink to="/" class="relative group px-5 py-7 text-xs font-black uppercase tracking-widest transition-colors" :class="isDashboardActive ? 'text-white' : 'text-slate-300 hover:text-white'">
                        <span>Dashboard</span>
                        <span class="absolute bottom-0 left-5 right-5 h-[2px] bg-civic-blue transition-transform origin-left" :class="isDashboardActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </NuxtLink>
                    <NuxtLink to="/report" class="relative group px-5 py-7 text-xs font-black uppercase tracking-widest transition-colors" :class="isReportActive ? 'text-white' : 'text-slate-300 hover:text-white'">
                        <span>Submit Issue</span>
                        <span class="absolute bottom-0 left-5 right-5 h-[2px] bg-civic-gold transition-transform origin-left" :class="isReportActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </NuxtLink>
                    <NuxtLink to="/scorecards" class="relative group px-5 py-7 text-xs font-black uppercase tracking-widest transition-colors" :class="isScorecardsActive ? 'text-white' : 'text-slate-300 hover:text-white'">
                        <span>MP Scorecards</span>
                        <span class="absolute bottom-0 left-5 right-5 h-[2px] bg-civic-blue transition-transform origin-left" :class="isScorecardsActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </NuxtLink>
                    <NuxtLink to="/projects" class="relative group px-5 py-7 text-xs font-black uppercase tracking-widest transition-colors" :class="isProjectsActive ? 'text-white' : 'text-slate-300 hover:text-white'">
                        <span>Project Tracker</span>
                        <span class="absolute bottom-0 left-5 right-5 h-[2px] bg-civic-gold transition-transform origin-left" :class="isProjectsActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </NuxtLink>
                    
                    <template v-if="auth.role === 'mp' || auth.role === 'admin'">
                        <div class="h-6 w-px bg-white/10 mx-2"></div>
                        <NuxtLink to="/mp" class="relative group px-5 py-7 text-xs font-black uppercase tracking-widest transition-colors" :class="isMpActive ? 'text-civic-gold' : 'text-civic-gold/80 hover:text-amber-300'">
                            <span>Official Console</span>
                            <span class="absolute bottom-0 left-5 right-5 h-[2px] bg-civic-gold transition-transform origin-left" :class="isMpActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                        </NuxtLink>
                    </template>
                </nav>

                <!-- Auth Actions -->
                <div class="hidden lg:flex items-center gap-4">
                    <template v-if="auth.isAuthenticated">
                       <div class="flex flex-col items-end mr-2">
                           <span class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Signed In</span>
                           <span class="text-xs text-white font-black uppercase tracking-wider">{{ auth.user?.name || 'Citizen' }}</span>
                       </div>
                       <button @click="handleLogout" class="w-9 h-9 rounded bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all flex items-center justify-center cursor-pointer">
                           <LogOut class="w-4 h-4" />
                       </button>
                    </template>
                    <template v-else>
                        <NuxtLink to="/login" class="text-xs font-black text-slate-300 hover:text-white uppercase tracking-widest transition-colors px-4">Log in</NuxtLink>
                        <NuxtLink to="/register" class="text-xs font-black bg-civic-blue hover:bg-civic-blue-hover text-white px-5 py-2.5 rounded transition-all uppercase tracking-widest">Register</NuxtLink>
                    </template>
                </div>
                
                <!-- Mobile Toggle -->
                <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden text-white p-2 focus:outline-none">
                    <Menu v-if="!mobileMenuOpen" class="w-7 h-7" />
                    <X v-else class="w-7 h-7" />
                </button>
            </div>
            
            <!-- Mobile Menu Dropdown -->
            <div v-if="mobileMenuOpen" class="lg:hidden absolute top-[100%] left-0 w-full bg-[#0c1220] border-b border-white/10 shadow-2xl flex flex-col z-50">
                <NuxtLink @click="mobileMenuOpen = false" to="/" class="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-xs" :class="isDashboardActive ? 'text-civic-blue bg-white/5' : 'text-white hover:text-slate-200'">Dashboard</NuxtLink>
                <NuxtLink @click="mobileMenuOpen = false" to="/report" class="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-xs" :class="isReportActive ? 'text-civic-gold bg-white/5' : 'text-white hover:text-slate-200'">Submit Issue</NuxtLink>
                <NuxtLink @click="mobileMenuOpen = false" to="/scorecards" class="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-xs" :class="isScorecardsActive ? 'text-civic-blue bg-white/5' : 'text-white hover:text-slate-200'">MP Scorecards</NuxtLink>
                <NuxtLink @click="mobileMenuOpen = false" to="/projects" class="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-xs" :class="isProjectsActive ? 'text-civic-gold bg-white/5' : 'text-white hover:text-slate-200'">Project Tracker</NuxtLink>
                <NuxtLink v-if="auth.role === 'mp' || auth.role === 'admin'" @click="mobileMenuOpen = false" to="/mp" class="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-xs" :class="isMpActive ? 'text-civic-gold bg-white/5' : 'text-civic-gold hover:text-amber-200'">Official Console</NuxtLink>
                
                <div class="p-4 bg-[#080c14]">
                    <template v-if="auth.isAuthenticated">
                       <button @click="handleLogout(); mobileMenuOpen = false" class="w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded text-xs uppercase tracking-wider">Logout</button>
                    </template>
                    <template v-else>
                        <NuxtLink @click="mobileMenuOpen = false" to="/login" class="block w-full text-center border border-white/10 text-white font-bold py-3 rounded text-xs uppercase tracking-wider mb-2">Log In</NuxtLink>
                        <NuxtLink @click="mobileMenuOpen = false" to="/register" class="block w-full text-center bg-civic-blue text-white font-bold py-3 rounded text-xs uppercase tracking-wider">Register</NuxtLink>
                    </template>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 w-full relative">
            <slot />
        </main>
        
        <!-- Detailed Mega Footer -->
        <footer class="bg-[#080c14] text-slate-400 pt-16 pb-8 border-t border-white/5 mt-auto relative grid-bg">
            <div class="absolute inset-0 bg-[#080c14]/90 z-0"></div>
            
            <div class="container mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 relative z-10">
                
                <div>
                     <div class="flex items-center gap-3 mb-6">
                        <div class="w-9 h-9 bg-white/5 border border-white/10 rounded flex items-center justify-center p-1.5 shadow-[0_0_10px_rgba(43,108,176,0.1)]">
                            <Cpu class="w-5 h-5 text-civic-blue" />
                        </div>
                        <div>
                            <h3 class="text-xl font-display font-black text-white leading-none">Voice<span class="text-civic-gold">Up</span></h3>
                            <p class="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Ghana's Civic Portal</p>
                        </div>
                     </div>
                     <p class="text-xs text-slate-500 leading-relaxed font-semibold mb-6 max-w-xs">
                         Bridging the gap between citizens and Members of Parliament through AI-driven accountability, transparent scorecards, and local language reporting.
                     </p>
                     <div class="flex items-center gap-3">
                         <a href="#" class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-civic-blue hover:text-white transition-all"><Mail class="w-3.5 h-3.5"/></a>
                         <a href="#" class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-civic-blue hover:text-white transition-all"><Phone class="w-3.5 h-3.5"/></a>
                         <a href="#" class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-civic-blue hover:text-white transition-all"><MapPin class="w-3.5 h-3.5"/></a>
                     </div>
                </div>

                <div>
                    <h4 class="text-white text-xs font-black uppercase tracking-widest border-b border-white/5 pb-2 inline-block mb-6">Quick Navigation</h4>
                    <ul class="space-y-3.5 text-xs font-bold tracking-wide">
                        <li><NuxtLink to="/" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Dashboard Feed</NuxtLink></li>
                        <li><NuxtLink to="/report" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Submit a Concern</NuxtLink></li>
                        <li><NuxtLink to="/scorecards" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> MP Scorecards</NuxtLink></li>
                        <li><NuxtLink to="/projects" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Project Tracker</NuxtLink></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white text-xs font-black uppercase tracking-widest border-b border-white/5 pb-2 inline-block mb-6">Departments</h4>
                    <ul class="space-y-3.5 text-xs font-bold tracking-wide">
                        <li><a href="#" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Roads & Infrastructure</a></li>
                        <li><a href="#" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Water & Utilities</a></li>
                        <li><a href="#" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Public Health & Sanitation</a></li>
                        <li><a href="#" class="hover:text-civic-blue transition-colors flex items-center gap-2"><Flag class="w-3 h-3 text-slate-600"/> Local Governance</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white text-xs font-black uppercase tracking-widest border-b border-white/5 pb-2 inline-block mb-6">Newsletter updates</h4>
                    <p class="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">Weekly digests of resolved reports and government budgets.</p>
                    <form @submit.prevent class="flex flex-col gap-2">
                        <input type="email" placeholder="Your Email Address" class="bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-civic-blue focus:ring-1 focus:ring-civic-blue transition-colors" />
                        <button type="submit" class="bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-black uppercase tracking-widest py-3 rounded transition-colors">Subscribe</button>
                    </form>
                </div>

            </div>
            
            <div class="container mx-auto px-6 lg:px-12 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <p class="text-[9px] uppercase tracking-widest font-bold text-slate-600">
                    &copy; {{ new Date().getFullYear() }} VoiceUp. Ghana Claude Hackathon Submission.
                </p>
                <div class="flex gap-6 text-[9px] uppercase tracking-widest font-bold text-slate-600">
                    <a href="#" class="hover:text-white">Privacy Policy</a>
                    <a href="#" class="hover:text-white">Terms of Service</a>
                    <a href="#" class="hover:text-white">Accessibility</a>
                </div>
            </div>
        </footer>
        
        <!-- Voice Assistant Floating Node for Accessibility -->
        <UiVoiceAssistant />
    </div>
</template>