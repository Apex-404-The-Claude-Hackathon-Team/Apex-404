import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('token')
  const userCookie = useCookie<any>('user_data')
  
  const user = ref<any>(userCookie.value || null)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role || null)

  async function login(credentials: any) {
    // Simulated mock authentication delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const email = credentials.email || 'citizen@voiceup.gh'
    const isMP = email.includes('mp')
    
    const mockUser = {
      id: isMP ? 'u_mp' : 'u_citizen',
      email: email,
      name: isMP ? 'Hon. John Doe' : email.split('@')[0],
      role: isMP ? 'mp' : 'citizen',
      constituencyId: 'c_dummy_1'
    }
    
    token.value = 'dummy_token_123'
    user.value = mockUser
    userCookie.value = mockUser
  }

  async function register(userData: any) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser = {
      id: 'u_citizen_new',
      email: userData.email,
      name: userData.fullName || 'New Citizen',
      role: 'citizen',
      constituencyId: userData.constituency || 'c_dummy_1'
    }
    
    token.value = 'dummy_token_123'
    user.value = mockUser
    userCookie.value = mockUser
  }

  async function logout() {
    token.value = null
    user.value = null
    userCookie.value = null
    await navigateTo('/login')
  }

  return {
    user,
    token,
    isAuthenticated,
    role,
    login,
    register,
    logout
  }
})