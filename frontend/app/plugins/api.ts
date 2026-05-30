declare module '#app' {
  interface NuxtApp {
    $api: ReturnType<typeof $fetch.create>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: ReturnType<typeof $fetch.create>
  }
}

export default defineNuxtPlugin((nuxtApp) => {

  const config = useRuntimeConfig()
  const token = useCookie('token')

  const $api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ request, options }) {
      const headers = new Headers(options.headers)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      // Forward client cookies to the backend during SSR for cookie-based auth/refresh
      if (import.meta.server) {
        const reqHeaders = useRequestHeaders(['cookie'])
        if (reqHeaders.cookie) {
          headers.set('cookie', reqHeaders.cookie)
        }
      }
      options.headers = headers
    },
    onResponseError({ request, response, options }) {
      // Handle the unwrapping logic if necessary, or throw the error directly.
      throw new Error(response._data?.message || response._data?.error || response.statusText);
    }
  })

  // Expose it to the Nuxt app
  nuxtApp.provide('api', $api)
})
