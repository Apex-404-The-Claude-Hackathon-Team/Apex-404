import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('token')
  const userCookie = useCookie<any>('user_data')
  
  const user = ref<any>(userCookie.value || null)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role || null)

  function saveUserSession(userData: any) {
    if (!userData) return
    // Normalize firstName and lastName to name for compatibility across UI layouts
    const name = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Citizen'
    const normalizedUser = {
      ...userData,
      name
    }
    user.value = normalizedUser
    userCookie.value = normalizedUser
  }

  function clearSession() {
    token.value = null
    user.value = null
    userCookie.value = null
  }

  async function fetchUser() {
    if (!token.value) return
    const { $api } = useNuxtApp()
    try {
      const res = await $api<any>('/api/auth/me')
      saveUserSession(res.user)
    } catch (err) {
      // If fetching fails, try to refresh using the refresh cookie
      try {
        await refreshSession()
      } catch (refreshErr) {
        clearSession()
      }
    }
  }

  async function refreshSession() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<any>('/api/auth/refresh', {
        method: 'POST'
      })
      token.value = res.accessToken
      saveUserSession(res.user)
    } catch (err) {
      clearSession()
      throw err
    }
  }

  async function login(credentials: any) {
    const { $api } = useNuxtApp()
    const res = await $api<any>('/api/auth/login', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password
      }
    })
    token.value = res.accessToken
    saveUserSession(res.user)
  }

  async function register(userData: any) {
    const { $api } = useNuxtApp()
    
    // Split fullName into firstName and lastName (required by backend)
    const nameParts = (userData.fullName || '').trim().split(/\s+/)
    const firstName = nameParts[0] || 'Citizen'
    const lastName = nameParts.slice(1).join(' ') || 'User'

    const res = await $api<any>('/api/auth/register', {
      method: 'POST',
      body: {
        firstName,
        lastName,
        email: userData.email,
        password: userData.password,
        constituency: userData.constituency
      }
    })
    token.value = res.accessToken
    saveUserSession(res.user)
  }

  async function logout() {
    const { $api } = useNuxtApp()
    try {
      if (token.value) {
        await $api('/api/auth/logout', { method: 'POST' })
      }
    } catch (err) {
      console.error('Failed to log out from backend:', err)
    } finally {
      clearSession()
      await navigateTo('/login')
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    role,
    login,
    register,
    logout,
    fetchUser,
    refreshSession,
    saveUserSession
  }
})