<template>
  <div class="p-6">
    <div class="max-w-screen-2xl mx-auto space-y-6">

      <h1 class="text-2xl font-bold">Dashboard</h1>

      <!-- Nutzerprofil -->
      <NuxtLink to="/account" class="block">
        <UCard class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                <img v-if="account?.image" :src="account.image" class="w-full h-full object-cover" alt="Avatar" />
                <span v-else class="text-lg font-semibold text-primary-600 dark:text-primary-300">
                  {{ (session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? '?').toUpperCase() }}
                </span>
              </div>
              <div>
                <p class="font-medium">{{ session?.user?.name ?? session?.user?.email }}</p>
                <p class="text-sm text-gray-500">{{ session?.user?.email }}</p>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    v-for="rid in account?.roleIds"
                    :key="rid"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :style="{ backgroundColor: colorToHex(roleById(rid)?.color ?? 'neutral') + '25', color: colorToHex(roleById(rid)?.color ?? 'neutral') }"
                  >{{ roleById(rid)?.name ?? rid }}</span>
                  <span
                    v-for="gid in account?.groupIds"
                    :key="gid"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                    :style="{ borderColor: colorToHex(groupById(gid)?.color ?? 'neutral'), color: colorToHex(groupById(gid)?.color ?? 'neutral') }"
                  >{{ groupById(gid)?.name ?? gid }}</span>
                </div>
              </div>
            </div>
            <UIcon name="i-lucide-chevron-right" class="text-gray-400 shrink-0" />
          </div>
        </UCard>
      </NuxtLink>


      <!-- Einstellungen -->
      <NuxtLink v-if="canAccess('settings')" to="/settings" class="block">
        <UCard class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-medium">Einstellungen</p>
              <p class="text-sm text-gray-500">Projektarten & Status konfigurieren</p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="text-gray-400 shrink-0" />
          </div>
        </UCard>
      </NuxtLink>

      <!-- Benutzer (nur Superadmin) -->
      <NuxtLink v-if="isSuperAdmin" to="/users" class="block">
        <UCard class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-medium">Benutzer</p>
              <p class="text-sm text-gray-500">Benutzer erstellen und verwalten</p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="text-gray-400 shrink-0" />
          </div>
        </UCard>
      </NuxtLink>

      <!-- Aktien Watchlist -->
      <NuxtLink to="/stocks" class="block">
        <UCard class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-medium">Aktien Watchlist</p>
              <p class="text-sm text-gray-500">Verfolge deine Aktien</p>
            </div>
            <UIcon name="i-lucide-chart-line" class="text-gray-400 shrink-0" />
          </div>
        </UCard>
      </NuxtLink>

      <!-- 2FA -->
      <NuxtLink to="/setup-2fa" class="block">
        <UCard class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-medium">Zwei-Faktor-Authentifizierung</p>
              <UBadge
                :color="session?.user?.twoFactorEnabled ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ session?.user?.twoFactorEnabled ? 'Aktiv' : 'Nicht aktiv' }}
              </UBadge>
            </div>
            <UIcon name="i-lucide-chevron-right" class="text-gray-400 shrink-0" />
          </div>
        </UCard>
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const headers = useRequestHeaders(['cookie'])
const { data: session } = await authClient.useSession(
  (url, options) => useFetch(url, {
    ...options,
    headers: { ...(options?.headers as Record<string, string> || {}), ...headers },
  })
)

const { canAccess, isSuperAdmin } = await usePageAccess()

const { data: account } = await useFetch<{
  roleIds: string[]; groupIds: string[]; image: string | null
}>('/api/account', { headers })

const { data: rolesData } = await useFetch<{ id: string; name: string; color: string }[]>('/api/roles', { headers })
const { data: groupsData } = await useFetch<{ id: string; name: string; color: string }[]>('/api/groups', { headers })

const roleById = (id: string) => rolesData.value?.find(r => r.id === id)
const groupById = (id: string) => groupsData.value?.find(g => g.id === id)

function colorToHex(color: string): string {
  if (color?.startsWith('#')) return color
  const map: Record<string, string> = {
    neutral: '#6b7280', primary: '#3b82f6', secondary: '#8b5cf6',
    success: '#22c55e', warning: '#f59e0b', error: '#ef4444', info: '#06b6d4',
  }
  return map[color] ?? '#6b7280'
}

</script>
