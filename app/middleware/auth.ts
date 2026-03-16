export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.client) return

  const headers = useRequestHeaders(['cookie'])
  const { data: session } = await authClient.useSession(
    (url, options) => useFetch(url, {
      ...options,
      headers: { ...(options?.headers as Record<string, string> || {}), ...headers },
    })
  )
  if (!session.value) {
    return navigateTo('/login')
  }
})
