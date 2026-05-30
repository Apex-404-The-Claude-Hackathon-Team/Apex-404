import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()
  if (auth.role !== 'mp' && auth.role !== 'admin') {
    return navigateTo('/')
  }
})
