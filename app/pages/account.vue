<template>
  <div class="p-6">
    <div class="max-w-screen-sm mx-auto space-y-8">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <h1 class="text-2xl font-bold">Mein Konto</h1>
      </div>

      <!-- Avatar -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">Profilbild</h2>
        </template>

        <div class="flex items-center gap-5">
          <div class="relative group shrink-0 w-20 h-20">
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              class="w-20 h-20 rounded-full object-cover"
              alt="Avatar"
            />
            <div
              v-else
              class="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center"
            >
              <span class="text-2xl font-semibold text-primary-600 dark:text-primary-300">
                {{ (me?.firstName?.[0] ?? me?.name?.[0] ?? '?').toUpperCase() }}
              </span>
            </div>
            <button
              type="button"
              class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              @click="avatarInput?.click()"
            >
              <UIcon name="i-lucide-camera" class="text-white text-lg" />
            </button>
          </div>
          <div>
            <UButton
              type="button"
              variant="outline"
              color="neutral"
              icon="i-lucide-upload"
              size="sm"
              :loading="uploadingAvatar"
              @click="avatarInput?.click()"
            >
              Foto hochladen
            </UButton>
            <p class="text-xs text-gray-400 mt-1">JPEG, PNG oder WebP</p>
            <p v-if="avatarError" class="text-xs text-red-500 mt-1">{{ avatarError }}</p>
          </div>
        </div>

        <input
          ref="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display: none"
          @change="uploadAvatar"
        />
      </UCard>

      <!-- Profil bearbeiten -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">Profil</h2>
        </template>

        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Vorname">
              <UInput v-model="form.firstName" placeholder="Max" class="w-full" />
            </UFormField>
            <UFormField label="Nachname">
              <UInput v-model="form.lastName" placeholder="Mustermann" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="E-Mail">
            <UInput v-model="form.email" type="email" class="w-full" />
          </UFormField>
          <USeparator />
          <UFormField label="Passwort ändern">
            <div class="flex items-center gap-2 w-full">
              <div class="relative flex-1">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Neues Passwort"
                  :disabled="passwordLocked"
                  class="w-full"
                />
                <button
                  v-if="!passwordLocked"
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  @click="showPassword = !showPassword"
                >
                  <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                </button>
              </div>
              <UButton
                type="button"
                :icon="passwordLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                :color="passwordLocked ? 'neutral' : 'primary'"
                variant="outline"
                @click="togglePasswordLock"
              />
            </div>
          </UFormField>
          <UAlert v-if="error" color="error" variant="subtle" :description="error" />
          <UAlert v-if="success" color="success" variant="subtle" description="Änderungen gespeichert." />
          <UButton type="submit" icon="i-lucide-save" :loading="saving">Speichern</UButton>
        </form>
      </UCard>

      <!-- Benachrichtigungen -->
      <UCard v-if="notificationPageOptions.length > 0">
        <template #header>
          <h2 class="font-semibold text-lg">Benachrichtigungen</h2>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-gray-500">Wähle aus, für welche Bereiche du Benachrichtigungen erhalten möchtest.</p>
          <div class="space-y-2">
            <label
              v-for="page in notificationPageOptions"
              :key="page.key"
              class="flex items-center gap-3 cursor-pointer"
            >
              <UCheckbox v-model="notificationForm[page.key]" />
              <span class="text-sm">{{ page.label }}</span>
            </label>
          </div>
          <UAlert v-if="notifSuccess" color="success" variant="subtle" description="Gespeichert." />
          <UButton size="sm" icon="i-lucide-save" :loading="savingNotif" @click="saveNotifications">Speichern</UButton>
        </div>
      </UCard>

      <!-- Rollen & Gruppen -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">Meine Rollen & Gruppen</h2>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">Rollen:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="rid in me?.roleIds"
                :key="rid"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :style="badgeStyle(roleById(rid)?.color)"
              >
                {{ roleById(rid)?.name ?? rid }}
              </span>
              <p v-if="!me?.roleIds?.length" class="text-sm text-gray-400">Keine Rollen zugewiesen</p>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Gruppen:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="gid in me?.groupIds"
                :key="gid"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                :style="badgeOutlineStyle(groupById(gid)?.color)"
              >
                {{ groupById(gid)?.name ?? gid }}
              </span>
              <p v-if="!me?.groupIds?.length" class="text-sm text-gray-400">Keiner Gruppe zugewiesen</p>
            </div>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data: me, refresh } = await useFetch<{
  id: string; firstName: string | null; lastName: string | null
  name: string; email: string; image: string | null; roleIds: string[]; groupIds: string[]
  allowedPages: string[]; notificationPages: string[] | null
}>('/api/account')

const { data: rolesData } = await useFetch<{ id: string; name: string; color: string }[]>('/api/roles')
const { data: groupsData } = await useFetch<{ id: string; name: string; color: string }[]>('/api/groups')

const roles = computed(() => rolesData.value ?? [])
const groups = computed(() => groupsData.value ?? [])

const roleById = (id: string) => roles.value.find(r => r.id === id)
const groupById = (id: string) => groups.value.find(g => g.id === id)

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

function badgeStyle(color?: string) {
  const c = color ?? '#6b7280'
  return { backgroundColor: `rgba(${hexToRgb(c)}, 0.15)`, color: c }
}

function badgeOutlineStyle(color?: string) {
  const c = color ?? '#6b7280'
  return { borderColor: c, color: c }
}

const form = reactive({
  firstName: me.value?.firstName ?? '',
  lastName: me.value?.lastName ?? '',
  email: me.value?.email ?? '',
  password: '',
})

const saving = ref(false)
const error = ref('')
const success = ref(false)
const passwordLocked = ref(true)
const showPassword = ref(false)

function togglePasswordLock() {
  passwordLocked.value = !passwordLocked.value
  if (passwordLocked.value) {
    form.password = ''
    showPassword.value = false
  }
}

// --- Avatar ---
const avatarVersion = ref(Date.now())
const avatarSrc = computed(() =>
  me.value?.image ? `${me.value.image}?v=${avatarVersion.value}` : undefined
)
const avatarInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const avatarError = ref('')

async function uploadAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarError.value = ''
  uploadingAvatar.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch('/api/account/avatar', { method: 'POST', body: fd })
    avatarVersion.value = Date.now()
    await refresh()
  } catch (e: any) {
    avatarError.value = e?.data?.message ?? 'Fehler beim Hochladen'
  } finally {
    uploadingAvatar.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

// --- Benachrichtigungen ---
const allPages = [
  { key: 'projects', label: 'Projekte' },
  { key: 'gallery', label: 'Galerie' },
  { key: 'settings', label: 'Einstellungen' },
  { key: 'calendar', label: 'Kalender / Ferien' },
]

const notificationPageOptions = computed(() =>
  allPages.filter(p => me.value?.allowedPages?.includes(p.key))
)

const notificationForm = reactive<Record<string, boolean>>(
  Object.fromEntries(allPages.map(p => [p.key, (me.value?.notificationPages ?? []).includes(p.key)]))
)

const savingNotif = ref(false)
const notifSuccess = ref(false)

async function saveNotifications() {
  savingNotif.value = true
  notifSuccess.value = false
  try {
    const enabled = allPages.map(p => p.key).filter(k => notificationForm[k])
    await $fetch('/api/account', { method: 'PATCH', body: { notificationPages: enabled } })
    notifSuccess.value = true
    setTimeout(() => { notifSuccess.value = false }, 3000)
  } finally {
    savingNotif.value = false
  }
}

async function save() {
  error.value = ''
  success.value = false
  saving.value = true
  try {
    await $fetch('/api/account', {
      method: 'PATCH',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password || undefined,
      },
    })
    form.password = ''
    passwordLocked.value = true
    showPassword.value = false
    success.value = true
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Fehler beim Speichern'
  } finally {
    saving.value = false
  }
}
</script>
