// Pages that require explicit role permission (superadmin always has access)
export const APP_PAGES = [
  { key: 'projects', label: 'Projekte', description: 'Projekte verwalten' },
  { key: 'projects.archived', label: 'Abgeschlossene Projekte', description: 'Abgeschlossene Projekte einsehen' },
  { key: 'projects.billing', label: 'Projekte Abrechnen', description: 'Projekte abrechnen und Abrechnungen einsehen' },
  { key: 'gallery', label: 'Galerie', description: 'Bilder hochladen und ansehen' },
  { key: 'settings', label: 'Einstellungen', description: 'Projektarten & Status konfigurieren' },
] as const

export type AppPageKey = typeof APP_PAGES[number]['key']

export async function usePageAccess() {
  const config = useRuntimeConfig()
  const headers = useRequestHeaders(['cookie'])

  const { data: account } = await useFetch<{ allowedPages: string[]; email: string }>('/api/account', {
    headers,
  })

  const isSuperAdmin = computed(() =>
    !!account.value?.email && account.value.email.trim() === (config.public.superAdminEmail as string)?.trim()
  )

  function canAccess(pageKey: AppPageKey): boolean {
    if (isSuperAdmin.value) return true
    return account.value?.allowedPages?.includes(pageKey) ?? false
  }

  return { canAccess, isSuperAdmin, allowedPages: account.value?.allowedPages ?? [] }
}
