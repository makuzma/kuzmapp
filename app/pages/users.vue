<template>
  <div class="p-6">
    <div class="max-w-screen-lg mx-auto space-y-8">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <h1 class="text-2xl font-bold">Benutzer</h1>
      </div>

      <!-- Kein Zugriff -->
      <UAlert v-if="!isSuperAdmin" color="error" variant="subtle" title="Kein Zugriff" description="Diese Seite ist nur für Administratoren zugänglich." />

      <template v-else>

        <!-- Rollen -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-lg">Rollen</h2>
            <p class="text-sm text-gray-500 mt-0.5">Verwalte Benutzerrollen</p>
          </template>

          <div class="space-y-4">
            <div class="space-y-2">
              <template v-for="r in roles" :key="r.id">
                <div v-if="editingRoleId === r.id" class="space-y-3 p-3 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950">
                  <UInput v-model="editRole.name" placeholder="Rollenname" class="w-full" />
                  <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-500 whitespace-nowrap">Ferientage:</label>
                    <UInput v-model.number="editRole.vacationDays" type="number" min="0" class="w-24" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 mb-2">Farbe:</p>
                    <div class="flex gap-2 flex-wrap items-center">
                      <button
                        v-for="hex in presetColors" :key="hex" type="button"
                        class="w-9 h-9 rounded-full border-3 transition-all hover:scale-110"
                        :style="{ backgroundColor: hex, borderColor: colorToHex(editRole.color) === hex ? '#1f2937' : 'transparent' }"
                        @click="editRole.color = hex"
                      />
                      <label
                        class="relative w-9 h-9 rounded-full border-3 transition-all hover:scale-110 cursor-pointer overflow-hidden flex items-center justify-center"
                        :style="{ backgroundColor: isCustomColor(editRole.color) ? editRole.color : '#e5e7eb', borderColor: isCustomColor(editRole.color) ? '#1f2937' : 'transparent' }"
                        title="Eigene Farbe"
                      >
                        <UIcon v-if="!isCustomColor(editRole.color)" name="i-lucide-plus" class="w-4 h-4 text-gray-500 pointer-events-none" />
                        <input type="color" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" :value="editRole.color.startsWith('#') ? editRole.color : '#3b82f6'" @input="e => editRole.color = (e.target as HTMLInputElement).value" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 mb-2">Seiten-Zugriff:</p>
                    <div class="space-y-1.5">
                      <template v-for="page in appPages" :key="page.key">
                        <p v-if="page.group" class="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-0.5">{{ page.group }}</p>
                        <label class="flex items-center gap-2.5 cursor-pointer" :class="page.sub ? 'pl-5' : ''">
                          <UCheckbox
                            :model-value="editRole.pages.includes(page.key)"
                            @update:model-value="toggleRolePage(page.key)"
                          />
                          <span class="text-sm font-medium">{{ page.label }}</span>
                          <span class="text-xs text-gray-400">– {{ page.description }}</span>
                        </label>
                      </template>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UButton size="sm" :loading="savingRole" @click="saveRole(r.id)">Speichern</UButton>
                    <UButton size="sm" variant="ghost" color="neutral" @click="editingRoleId = null">Abbrechen</UButton>
                  </div>
                </div>

                <div v-else class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: colorToHex(r.color) + '25', color: colorToHex(r.color) }">{{ r.name }}</span>
                  <div class="flex gap-1">
                    <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startEditRole(r)" />
                    <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingRole === r.id" @click="deleteRole(r.id)" />
                  </div>
                </div>
              </template>
              <p v-if="roles.length === 0" class="text-sm text-gray-400 text-center py-4">Noch keine Rollen</p>
            </div>

            <USeparator />

            <form class="space-y-3" @submit.prevent="addRole">
              <div class="flex gap-2 flex-wrap">
                <UInput v-model="newRole.name" placeholder="Rollenname, z.B. Redakteur" class="flex-1 min-w-32" />
                <UInput v-model.number="newRole.vacationDays" type="number" min="0" placeholder="Ferientage" class="w-28" />
                <UButton type="submit" icon="i-lucide-plus" :loading="addingRole">Hinzufügen</UButton>
              </div>
              <div class="flex gap-2 flex-wrap items-center">
                <button
                  v-for="hex in presetColors" :key="hex" type="button"
                  class="w-9 h-9 rounded-full border-3 transition-all hover:scale-110"
                  :style="{ backgroundColor: hex, borderColor: colorToHex(newRole.color) === hex ? '#1f2937' : 'transparent' }"
                  @click="newRole.color = hex"
                />
                <label
                  class="relative w-9 h-9 rounded-full border-3 transition-all hover:scale-110 cursor-pointer overflow-hidden flex items-center justify-center"
                  :style="{ backgroundColor: isCustomColor(newRole.color) ? newRole.color : '#e5e7eb', borderColor: isCustomColor(newRole.color) ? '#1f2937' : 'transparent' }"
                  title="Eigene Farbe"
                >
                  <UIcon v-if="!isCustomColor(newRole.color)" name="i-lucide-plus" class="w-4 h-4 text-gray-500 pointer-events-none" />
                  <input type="color" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" :value="newRole.color.startsWith('#') ? newRole.color : '#3b82f6'" @input="e => newRole.color = (e.target as HTMLInputElement).value" />
                </label>
              </div>
              <UAlert v-if="roleError" color="error" variant="subtle" :description="roleError" />
            </form>
          </div>
        </UCard>

        <!-- Gruppen -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-lg">Gruppen</h2>
            <p class="text-sm text-gray-500 mt-0.5">Verwalte Benutzergruppen</p>
          </template>

          <div class="space-y-4">
            <div class="space-y-2">
              <template v-for="g in groups" :key="g.id">
                <div v-if="editingGroupId === g.id" class="space-y-3 p-3 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950">
                  <UInput v-model="editGroup.name" placeholder="Gruppenname" class="w-full" />
                  <div>
                    <p class="text-sm text-gray-500 mb-2">Farbe:</p>
                    <div class="flex gap-2 flex-wrap items-center">
                      <button
                        v-for="hex in presetColors" :key="hex" type="button"
                        class="w-9 h-9 rounded-full border-3 transition-all hover:scale-110"
                        :style="{ backgroundColor: hex, borderColor: colorToHex(editGroup.color) === hex ? '#1f2937' : 'transparent' }"
                        @click="editGroup.color = hex"
                      />
                      <label
                        class="relative w-9 h-9 rounded-full border-3 transition-all hover:scale-110 cursor-pointer overflow-hidden flex items-center justify-center"
                        :style="{ backgroundColor: isCustomColor(editGroup.color) ? editGroup.color : '#e5e7eb', borderColor: isCustomColor(editGroup.color) ? '#1f2937' : 'transparent' }"
                        title="Eigene Farbe"
                      >
                        <UIcon v-if="!isCustomColor(editGroup.color)" name="i-lucide-plus" class="w-4 h-4 text-gray-500 pointer-events-none" />
                        <input type="color" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" :value="editGroup.color.startsWith('#') ? editGroup.color : '#3b82f6'" @input="e => editGroup.color = (e.target as HTMLInputElement).value" />
                      </label>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UButton size="sm" :loading="savingGroup" @click="saveGroup(g.id)">Speichern</UButton>
                    <UButton size="sm" variant="ghost" color="neutral" @click="editingGroupId = null">Abbrechen</UButton>
                  </div>
                </div>

                <div v-else class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: colorToHex(g.color) + '25', color: colorToHex(g.color) }">{{ g.name }}</span>
                  <div class="flex gap-1">
                    <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startEditGroup(g)" />
                    <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingGroup === g.id" @click="deleteGroup(g.id)" />
                  </div>
                </div>
              </template>
              <p v-if="groups.length === 0" class="text-sm text-gray-400 text-center py-4">Noch keine Gruppen</p>
            </div>

            <USeparator />

            <form class="space-y-3" @submit.prevent="addGroup">
              <div class="flex gap-2 flex-wrap">
                <UInput v-model="newGroup.name" placeholder="Gruppenname, z.B. Marketing" class="flex-1 min-w-32" />
                <UButton type="submit" icon="i-lucide-plus" :loading="addingGroup">Hinzufügen</UButton>
              </div>
              <div class="flex gap-2 flex-wrap items-center">
                <button
                  v-for="hex in presetColors" :key="hex" type="button"
                  class="w-9 h-9 rounded-full border-3 transition-all hover:scale-110"
                  :style="{ backgroundColor: hex, borderColor: colorToHex(newGroup.color) === hex ? '#1f2937' : 'transparent' }"
                  @click="newGroup.color = hex"
                />
                <label
                  class="relative w-9 h-9 rounded-full border-3 transition-all hover:scale-110 cursor-pointer overflow-hidden flex items-center justify-center"
                  :style="{ backgroundColor: isCustomColor(newGroup.color) ? newGroup.color : '#e5e7eb', borderColor: isCustomColor(newGroup.color) ? '#1f2937' : 'transparent' }"
                  title="Eigene Farbe"
                >
                  <UIcon v-if="!isCustomColor(newGroup.color)" name="i-lucide-plus" class="w-4 h-4 text-gray-500 pointer-events-none" />
                  <input type="color" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" :value="newGroup.color.startsWith('#') ? newGroup.color : '#3b82f6'" @input="e => newGroup.color = (e.target as HTMLInputElement).value" />
                </label>
              </div>
              <UAlert v-if="groupError" color="error" variant="subtle" :description="groupError" />
            </form>
          </div>
        </UCard>

        <!-- Benutzerliste -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-lg">Alle Benutzer</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ users.length }} Benutzer registriert</p>
          </template>

          <div class="space-y-2">
            <template v-for="u in users" :key="u.id">
              <!-- Edit-Modus -->
              <div v-if="editingUserId === u.id" class="space-y-3 p-3 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <UInput v-model="editUser.firstName" placeholder="Vorname" />
                  <UInput v-model="editUser.lastName" placeholder="Name" />
                  <UInput v-model="editUser.email" type="email" placeholder="E-Mail" />
                  <UInput v-model="editUser.password" type="password" placeholder="Neues Passwort (optional)" />
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-2">Rolle (max. 1):</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="r in roles" :key="r.id" type="button"
                      class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
                      :class="editUser.roleId === r.id
                        ? 'bg-primary-100 dark:bg-primary-900 border-primary-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="selectEditRole(r.id)"
                    >
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: colorToHex(r.color) + '25', color: colorToHex(r.color) }">{{ r.name }}</span>
                    </button>
                    <p v-if="roles.length === 0" class="text-sm text-gray-400">Noch keine Rollen vorhanden</p>
                  </div>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-2">Gruppen:</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="g in groups" :key="g.id" type="button"
                      class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
                      :class="editUser.groupIds.includes(g.id)
                        ? 'bg-primary-100 dark:bg-primary-900 border-primary-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="toggleEditGroup(g.id)"
                    >
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: colorToHex(g.color) + '25', color: colorToHex(g.color) }">{{ g.name }}</span>
                    </button>
                    <p v-if="groups.length === 0" class="text-sm text-gray-400">Noch keine Gruppen vorhanden</p>
                  </div>
                </div>
                <UAlert v-if="editError" color="error" variant="subtle" :description="editError" />
                <div class="flex gap-2">
                  <UButton size="sm" :loading="savingUser" @click="saveUser(u.id)">Speichern</UButton>
                  <UButton size="sm" variant="ghost" color="neutral" @click="editingUserId = null">Abbrechen</UButton>
                </div>
              </div>

              <!-- Normal-Modus -->
              <div v-else class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                    <span class="text-sm font-semibold text-primary-600 dark:text-primary-300">{{ initials(u) }}</span>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="font-medium truncate">{{ displayName(u) }}</p>
                      <UBadge v-if="u.email === superAdminEmail" color="primary" variant="subtle" size="sm">Admin</UBadge>
                      <span v-for="rid in u.roleIds" :key="rid" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: colorToHex(roles.find(r => r.id === rid)?.color ?? 'neutral') + '25', color: colorToHex(roles.find(r => r.id === rid)?.color ?? 'neutral') }">
                        {{ roles.find(r => r.id === rid)?.name }}
                      </span>
                      <span v-for="gid in u.groupIds" :key="gid" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border" :style="{ borderColor: colorToHex(groups.find(g => g.id === gid)?.color ?? 'neutral'), color: colorToHex(groups.find(g => g.id === gid)?.color ?? 'neutral') }">
                        {{ groups.find(g => g.id === gid)?.name }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 truncate">{{ u.email }}</p>
                  </div>
                </div>
                <div class="flex gap-1 shrink-0">
                  <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startEditUser(u)" />
                  <UButton v-if="u.email !== superAdminEmail" variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingUser === u.id" @click="deleteUser(u.id)" />
                </div>
              </div>
            </template>
            <p v-if="users.length === 0" class="text-sm text-gray-400 text-center py-4">Noch keine Benutzer</p>
          </div>
        </UCard>

        <!-- Neuer Benutzer -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-lg">Neuen Benutzer erstellen</h2>
          </template>

          <form class="space-y-4" @submit.prevent="createUser">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Vorname">
                <UInput v-model="form.firstName" placeholder="Max" class="w-full" />
              </UFormField>
              <UFormField label="Name">
                <UInput v-model="form.lastName" placeholder="Mustermann" class="w-full" />
              </UFormField>
              <UFormField label="E-Mail" required>
                <UInput v-model="form.email" type="email" placeholder="max@beispiel.de" class="w-full" />
              </UFormField>
              <UFormField label="Passwort" required>
                <UInput v-model="form.password" type="password" placeholder="••••••••" class="w-full" />
              </UFormField>
            </div>
            <UAlert v-if="createError" color="error" variant="subtle" :description="createError" />
            <UButton type="submit" icon="i-lucide-user-plus" :loading="creating">Benutzer erstellen</UButton>
          </form>
        </UCard>

        <!-- Aktivitätsprotokoll -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-lg">Aktivitätsprotokoll</h2>
                <p class="text-sm text-gray-500 mt-0.5">{{ logsTotal }} Einträge gesamt</p>
              </div>
              <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="logsStatus === 'pending'" @click="refreshLogs()" />
            </div>
          </template>

          <div class="space-y-1">
            <div
              v-for="log in logs" :key="log.id"
              class="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                <UIcon :name="actionIcon(log.action)" class="text-gray-500 dark:text-gray-400 text-sm" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-sm">{{ log.userName ?? log.userEmail ?? 'Unbekannt' }}</span>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ formatAction(log.action) }}</UBadge>
                  <span v-if="log.meta?.name" class="text-sm text-gray-500 truncate">{{ log.meta.name }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(log.createdAt) }}</p>
              </div>
            </div>
            <p v-if="logs.length === 0 && logsStatus !== 'pending'" class="text-sm text-gray-400 text-center py-4">Noch keine Aktivitäten</p>
            <div v-if="logsStatus === 'pending'" class="flex justify-center py-6">
              <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-xl" />
            </div>
          </div>

          <template v-if="logsTotalPages > 1" #footer>
            <div class="flex items-center justify-between">
              <UButton variant="ghost" color="neutral" icon="i-lucide-chevron-left" :disabled="logsPage === 1" @click="logsPage--" />
              <span class="text-sm text-gray-500">Seite {{ logsPage }} von {{ logsTotalPages }}</span>
              <UButton variant="ghost" color="neutral" icon="i-lucide-chevron-right" :disabled="logsPage >= logsTotalPages" @click="logsPage++" />
            </div>
          </template>
        </UCard>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { isSuperAdmin } = await useSuperAdmin()
const config = useRuntimeConfig()
const superAdminEmail = config.public.superAdminEmail

const presetColors = [
  '#6b7280', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]
function colorToHex(color: string): string {
  if (color?.startsWith('#')) return color
  const map: Record<string, string> = {
    neutral: '#6b7280', primary: '#3b82f6', secondary: '#8b5cf6',
    success: '#22c55e', warning: '#f59e0b', error: '#ef4444', info: '#06b6d4',
  }
  return map[color] ?? '#6b7280'
}
function isCustomColor(color: string): boolean {
  return !!color?.startsWith('#') && !presetColors.includes(color)
}

const appPages: { key: string; label: string; description: string; group?: string; sub?: boolean }[] = [
  { key: 'projects', label: 'Projekte', description: 'Projekte verwalten' },
  { key: 'projects.archived', label: 'Abgeschlossene Projekte', description: 'Abgeschlossene Projekte einsehen', sub: true },
  { key: 'projects.billing', label: 'Projekte Abrechnen', description: 'Projekte abrechnen und Abrechnungen einsehen', sub: true },
  { key: 'gallery', label: 'Galerie', description: 'Bilder hochladen und ansehen' },
  { key: 'settings', label: 'Einstellungen', description: 'Projektarten & Status konfigurieren' },
  { key: 'calendar', label: 'Kalender', description: 'Kalender & Ferien einsehen', group: 'Ferien' },
  { key: 'ferien.approval', label: 'Approval', description: 'Ferienanträge genehmigen', sub: true },
]

// --- Rollen ---
type Role = { id: string; name: string; color: string; pages: string[]; vacationDays: number }
const { data: rolesData, refresh: refreshRoles } = await useFetch<Role[]>('/api/admin/roles')
const roles = computed(() => rolesData.value ?? [])

const newRole = reactive({ name: '', color: 'neutral', vacationDays: 0 })
const addingRole = ref(false)
const roleError = ref('')
const editingRoleId = ref<string | null>(null)
const editRole = reactive({ name: '', color: 'neutral', pages: [] as string[], vacationDays: 0 })
const savingRole = ref(false)
const deletingRole = ref<string | null>(null)

function startEditRole(r: Role) {
  editingRoleId.value = r.id
  editRole.name = r.name
  editRole.color = r.color
  editRole.pages = [...(r.pages ?? [])]
  editRole.vacationDays = r.vacationDays ?? 0
}

function toggleRolePage(key: string) {
  const i = editRole.pages.indexOf(key)
  if (i === -1) editRole.pages.push(key)
  else editRole.pages.splice(i, 1)
}

async function saveRole(id: string) {
  savingRole.value = true
  await $fetch(`/api/admin/roles/${id}`, { method: 'PATCH', body: editRole })
  editingRoleId.value = null
  savingRole.value = false
  await refreshRoles()
}

async function addRole() {
  roleError.value = ''
  addingRole.value = true
  try {
    await $fetch('/api/admin/roles', { method: 'POST', body: newRole })
    newRole.name = ''
    newRole.color = 'neutral'
    newRole.vacationDays = 0
    await refreshRoles()
  } catch (e: any) {
    roleError.value = e?.data?.message ?? 'Fehler'
  } finally {
    addingRole.value = false
  }
}

async function deleteRole(id: string) {
  deletingRole.value = id
  await $fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
  deletingRole.value = null
  await refreshRoles()
}

// --- Gruppen ---
type Group = { id: string; name: string; color: string }
const { data: groupsData, refresh: refreshGroups } = await useFetch<Group[]>('/api/admin/groups')
const groups = computed(() => groupsData.value ?? [])

const newGroup = reactive({ name: '', color: 'neutral' })
const addingGroup = ref(false)
const groupError = ref('')
const editingGroupId = ref<string | null>(null)
const editGroup = reactive({ name: '', color: 'neutral' })
const savingGroup = ref(false)
const deletingGroup = ref<string | null>(null)

function startEditGroup(g: Group) {
  editingGroupId.value = g.id
  editGroup.name = g.name
  editGroup.color = g.color
}

async function saveGroup(id: string) {
  savingGroup.value = true
  await $fetch(`/api/admin/groups/${id}`, { method: 'PATCH', body: editGroup })
  editingGroupId.value = null
  savingGroup.value = false
  await refreshGroups()
}

async function addGroup() {
  groupError.value = ''
  addingGroup.value = true
  try {
    await $fetch('/api/admin/groups', { method: 'POST', body: newGroup })
    newGroup.name = ''
    newGroup.color = 'neutral'
    await refreshGroups()
  } catch (e: any) {
    groupError.value = e?.data?.message ?? 'Fehler'
  } finally {
    addingGroup.value = false
  }
}

async function deleteGroup(id: string) {
  deletingGroup.value = id
  await $fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
  deletingGroup.value = null
  await refreshGroups()
}

// --- Benutzer ---
type AppUser = {
  id: string; firstName: string | null; lastName: string | null
  name: string; email: string; emailVerified: boolean
  createdAt: string; roleIds: string[]; groupIds: string[]
}

const { data: usersData, refresh: refreshUsers } = await useFetch<AppUser[]>('/api/admin/users')
const users = computed(() => usersData.value ?? [])

const editingUserId = ref<string | null>(null)
const editUser = reactive({ firstName: '', lastName: '', email: '', password: '', roleId: '' as string, groupIds: [] as string[] })
const savingUser = ref(false)
const editError = ref('')
const deletingUser = ref<string | null>(null)

const form = reactive({ firstName: '', lastName: '', email: '', password: '' })
const creating = ref(false)
const createError = ref('')

function initials(u: AppUser) {
  if (u.firstName || u.lastName) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
  return u.name?.[0]?.toUpperCase() ?? '?'
}

function displayName(u: AppUser) {
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return u.name
}

function startEditUser(u: AppUser) {
  editingUserId.value = u.id
  editUser.firstName = u.firstName ?? ''
  editUser.lastName = u.lastName ?? ''
  editUser.email = u.email
  editUser.password = ''
  editUser.roleId = u.roleIds?.[0] ?? ''
  editUser.groupIds = [...(u.groupIds ?? [])]
}

function selectEditRole(roleId: string) {
  editUser.roleId = editUser.roleId === roleId ? '' : roleId
}

function toggleEditGroup(groupId: string) {
  const i = editUser.groupIds.indexOf(groupId)
  if (i === -1) editUser.groupIds.push(groupId)
  else editUser.groupIds.splice(i, 1)
}

async function saveUser(id: string) {
  editError.value = ''
  savingUser.value = true
  try {
    await $fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        password: editUser.password || undefined,
        roleIds: editUser.roleId ? [editUser.roleId] : [],
        groupIds: editUser.groupIds,
      },
    })
    editingUserId.value = null
    await refreshUsers()
  } catch (e: any) {
    editError.value = e?.data?.message ?? 'Fehler beim Speichern'
  } finally {
    savingUser.value = false
  }
}

async function deleteUser(id: string) {
  deletingUser.value = id
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await refreshUsers()
  } finally {
    deletingUser.value = null
  }
}

async function createUser() {
  createError.value = ''
  if (!form.email.trim() || !form.password.trim()) {
    createError.value = 'E-Mail und Passwort sind erforderlich.'
    return
  }
  creating.value = true
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: form })
    form.firstName = ''
    form.lastName = ''
    form.email = ''
    form.password = ''
    await refreshUsers()
  } catch (e: any) {
    createError.value = e?.data?.message ?? 'Fehler beim Erstellen des Benutzers'
  } finally {
    creating.value = false
  }
}

// --- Aktivitätsprotokoll ---
type LogEntry = {
  id: string
  action: string
  target: string | null
  meta: Record<string, any> | null
  createdAt: string
  userName: string | null
  userEmail: string | null
}

const logsPage = ref(1)
const { data: logsData, status: logsStatus, refresh: refreshLogs } = await useFetch<{
  logs: LogEntry[]
  total: number
  page: number
  limit: number
}>(() => `/api/admin/logs?page=${logsPage.value}`)

const logs = computed(() => logsData.value?.logs ?? [])
const logsTotal = computed(() => logsData.value?.total ?? 0)
const logsTotalPages = computed(() => Math.ceil(logsTotal.value / (logsData.value?.limit ?? 50)))

function actionIcon(action: string): string {
  if (action.includes('create')) return 'i-lucide-plus-circle'
  if (action.includes('delete')) return 'i-lucide-trash-2'
  if (action.includes('update') || action.includes('edit')) return 'i-lucide-pencil'
  if (action.includes('login')) return 'i-lucide-log-in'
  if (action.includes('logout')) return 'i-lucide-log-out'
  return 'i-lucide-activity'
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}
</script>
