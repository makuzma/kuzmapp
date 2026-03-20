<template>
  <header class="sticky top-0 z-[9999] border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
    <div class="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">

      <!-- Logo -->
      <NuxtLink to="/dashboard" class="flex items-center gap-2 shrink-0 mr-2">
        <img src="/bg/hk-logo-red.svg" alt="kuzmapp" class="w-7 h-7" />
        <span class="font-bold text-sm hidden sm:block">kuzmapp</span>
      </NuxtLink>

      <!-- Desktop Nav (lg+) -->
      <nav class="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/dashboard'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-layout-dashboard" class="w-3.5 h-3.5" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          v-if="canAccess('settings')"
          to="/settings"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/settings'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-settings" class="w-3.5 h-3.5" />
          Einstellungen
        </NuxtLink>
        <NuxtLink
          v-if="canAccess('calendar')"
          to="/vacations"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/vacations'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-sun" class="w-3.5 h-3.5" />
          Ferienplanung
        </NuxtLink>
        <NuxtLink
          to="/stocks"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/stocks'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-chart-line" class="w-3.5 h-3.5" />
          Aktien
        </NuxtLink>
        <NuxtLink
          to="/finance"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/finance'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-wallet" class="w-3.5 h-3.5" />
          Finance
        </NuxtLink>
        <NuxtLink
          v-if="isSuperAdmin"
          to="/users"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/users'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
          Benutzer
        </NuxtLink>
        <NuxtLink
          v-if="isSuperAdmin"
          to="/styleguide"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="route.path === '/styleguide'
            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon name="i-lucide-palette" class="w-3.5 h-3.5" />
          Styleguide
        </NuxtLink>
      </nav>

      <!-- Spacer on mobile/tablet -->
      <div class="flex-1 lg:hidden" />

      <!-- Right side -->
      <div class="flex items-center gap-1 shrink-0">
        <ClientOnly><ColorModeButton /></ClientOnly>

        <!-- Notification Bell -->
        <div class="relative" ref="bellRef">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            class="relative"
            :padded="false"
            @click="notifOpen = !notifOpen"
          >
            <div class="w-8 h-8 flex items-center justify-center">
              <UIcon name="i-lucide-bell" class="w-4.5 h-4.5" />
              <span
                v-if="unreadCount > 0"
                class="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
              >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </div>
          </UButton>

          <Transition name="dropdown">
            <div
              v-if="notifOpen"
              class="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span class="font-semibold text-sm">Benachrichtigungen</span>
                <button
                  v-if="unreadCount > 0"
                  class="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  @click="markAllRead"
                >
                  Alle als gelesen
                </button>
              </div>
              <div class="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  :class="{ 'bg-blue-50/50 dark:bg-blue-900/10': !n.read }"
                  @click="n.read = true"
                >
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <UIcon :name="n.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ n.title }}</p>
                    <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.body }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ n.time }}</p>
                  </div>
                  <div v-if="!n.read" class="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                </div>
                <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
                  Keine Benachrichtigungen
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Avatar dropdown -->
        <div class="relative" ref="avatarRef">
          <button
            class="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-2 ring-transparent hover:ring-blue-400 transition-all"
            @click="avatarOpen = !avatarOpen"
          >
            <img v-if="account?.image" :src="account.image" class="w-full h-full object-cover" alt="" />
            <span v-else class="text-sm font-semibold text-blue-600 dark:text-blue-300">{{ initials }}</span>
          </button>

          <Transition name="dropdown">
            <div
              v-if="avatarOpen"
              class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ session?.user?.name ?? session?.user?.email }}</p>
                <p class="text-xs text-gray-500 truncate">{{ session?.user?.email }}</p>
              </div>
              <div class="py-1">
                <NuxtLink
                  to="/account"
                  class="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  @click="avatarOpen = false"
                >
                  <UIcon name="i-lucide-user-circle" class="w-4 h-4 text-gray-400" />
                  Account-Einstellungen
                </NuxtLink>
                <NuxtLink
                  to="/setup-2fa"
                  class="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  @click="avatarOpen = false"
                >
                  <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-gray-400" />
                  Zwei-Faktor-Auth
                  <UBadge
                    :color="session?.user?.twoFactorEnabled ? 'success' : 'neutral'"
                    variant="subtle"
                    size="xs"
                    class="ml-auto"
                  >{{ session?.user?.twoFactorEnabled ? 'Aktiv' : 'Inaktiv' }}</UBadge>
                </NuxtLink>
                <div class="border-t border-gray-100 dark:border-gray-800 my-1" />
                <button
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  :disabled="logoutLoading"
                  @click="handleLogout"
                >
                  <UIcon name="i-lucide-log-out" class="w-4 h-4" />
                  {{ logoutLoading ? 'Wird abgemeldet…' : 'Abmelden' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Burger Button (below lg) -->
        <button
          class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
          @click="mobileOpen = !mobileOpen"
        >
          <UIcon :name="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile / Tablet Menu -->
    <Transition name="dropdown">
      <div
        v-if="mobileOpen"
        class="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
      >
        <nav class="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col gap-1">
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/dashboard'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-layout-dashboard" class="w-4 h-4" />
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-if="canAccess('settings')"
            to="/settings"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/settings'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-settings" class="w-4 h-4" />
            Einstellungen
          </NuxtLink>
          <NuxtLink
            v-if="canAccess('calendar')"
            to="/vacations"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/vacations'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-sun" class="w-4 h-4" />
            Ferienplanung
          </NuxtLink>
          <NuxtLink
            to="/stocks"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/stocks'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-chart-line" class="w-4 h-4" />
            Aktien
          </NuxtLink>
          <NuxtLink
            to="/finance"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/finance'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-wallet" class="w-4 h-4" />
            Finance
          </NuxtLink>
          <NuxtLink
            v-if="isSuperAdmin"
            to="/users"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/users'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-users" class="w-4 h-4" />
            Benutzer
          </NuxtLink>
          <NuxtLink
            v-if="isSuperAdmin"
            to="/styleguide"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === '/styleguide'
              ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="mobileOpen = false"
          >
            <UIcon name="i-lucide-palette" class="w-4 h-4" />
            Styleguide
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const headers = useRequestHeaders(['cookie'])

const { data: session } = await authClient.useSession(
  (url, options) => useFetch(url, {
    ...options,
    headers: { ...(options?.headers as Record<string, string> || {}), ...headers },
  })
)

const { data: account } = useFetch<{ allowedPages: string[]; email: string; image: string | null }>('/api/account', { headers })

const isSuperAdmin = computed(() =>
  !!account.value?.email && account.value.email.trim() === (config.public.superAdminEmail as string)?.trim()
)

function canAccess(pageKey: string): boolean {
  if (isSuperAdmin.value) return true
  return account.value?.allowedPages?.includes(pageKey) ?? false
}

const initials = computed(() => {
  const name = session.value?.user?.name ?? session.value?.user?.email ?? '?'
  return name[0].toUpperCase()
})

// --- Mobile menu ---
const mobileOpen = ref(false)

// Close on route change
watch(() => route.path, () => { mobileOpen.value = false })

// --- Notifications ---
const notifOpen = ref(false)
const bellRef = ref<HTMLElement>()

const notifications = ref([
  { id: '1', title: 'Willkommen bei kuzmapp', body: 'Dein Konto wurde erfolgreich eingerichtet.', icon: 'i-lucide-sparkles', time: 'Jetzt', read: false },
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function markAllRead() {
  notifications.value.forEach(n => n.read = true)
}

// --- Avatar ---
const avatarOpen = ref(false)
const avatarRef = ref<HTMLElement>()
const logoutLoading = ref(false)

async function handleLogout() {
  logoutLoading.value = true
  await signOut()
  await navigateTo('/login')
}

// Close dropdowns on outside click
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (notifOpen.value && bellRef.value && !bellRef.value.contains(e.target as Node)) {
      notifOpen.value = false
    }
    if (avatarOpen.value && avatarRef.value && !avatarRef.value.contains(e.target as Node)) {
      avatarOpen.value = false
    }
  })
})
</script>
