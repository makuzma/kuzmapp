export default defineNuxtRouteMiddleware(async (to) => {
  const requiredPage = to.meta.requiredPage as string | string[] | undefined
  if (!requiredPage) return

  const config = useRuntimeConfig()
  const headers = useRequestHeaders(['cookie'])

  const { data: account } = await useFetch<{ allowedPages: string[]; email: string }>('/api/account', {
    headers,
  })

  const superAdminEmail = (config.public.superAdminEmail as string)?.trim()
  if (account.value?.email?.trim() === superAdminEmail) return

  const allowed = account.value?.allowedPages ?? []
  const required = Array.isArray(requiredPage) ? requiredPage : [requiredPage]
  if (!required.some(p => allowed.includes(p))) {
    return navigateTo('/dashboard')
  }
})
