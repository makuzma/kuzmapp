export async function useSuperAdmin() {
  const config = useRuntimeConfig()

  const headers = useRequestHeaders(['cookie'])
  const { data: session } = await authClient.useSession(
    (url, options) => useFetch(url, {
      ...options,
      headers: { ...(options?.headers as Record<string, string> || {}), ...headers },
    })
  )

  const isSuperAdmin = computed(() =>
    session.value?.user?.email === config.public.superAdminEmail
  )

  return { isSuperAdmin }
}
