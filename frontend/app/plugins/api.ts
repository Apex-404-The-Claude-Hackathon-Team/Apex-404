export default defineNuxtPlugin((nuxtApp) => {

  const config = useRuntimeConfig()
  const token = useCookie('token')

  const $api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ request, options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    onResponseError({ request, response, options }) {
      // Handle the unwrapping logic if necessary, or throw the error directly.
      throw new Error(response._data?.error || response.statusText);
    }
  })

  // Expose it to the Nuxt app
  nuxtApp.provide('api', $api)
})
