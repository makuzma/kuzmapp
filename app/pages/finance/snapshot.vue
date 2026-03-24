<template>
  <div class="p-6 min-h-screen">
    <div class="max-w-2xl mx-auto space-y-6">

      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" to="/finance" />
          <h1 class="font-instrument italic text-5xl">Snapshots</h1>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="rangeFrom" type="date" class="backfill-date-input" />
          <span class="text-xs text-gray-400">–</span>
          <input v-model="rangeTo" type="date" class="backfill-date-input" />
          <UButton
            icon="i-lucide-calendar-range"
            variant="soft"
            color="primary"
            size="sm"
            :loading="backfillLoading"
            :disabled="!rangeFrom || !rangeTo"
            @click="triggerBackfill(rangeFrom, rangeTo)"
          >Backfill</UButton>
          <UButton
            icon="i-lucide-calendar"
            variant="soft"
            color="neutral"
            size="sm"
            :loading="backfillLoading"
            @click="triggerLastMonth"
          >1 Monat</UButton>
          <UButton
            icon="i-lucide-clock"
            variant="soft"
            color="neutral"
            size="sm"
            :loading="backfillLoading"
            @click="triggerBackfill()"
          >Letzte Woche</UButton>
        </div>
      </div>

      <template v-if="pending">
        <USkeleton v-for="n in 4" :key="n" class="h-40 rounded-xl" />
      </template>

      <template v-else-if="!snapshots?.length">
        <p class="text-sm text-gray-500">Noch keine Snapshots vorhanden.</p>
      </template>

      <template v-else>
        <div
          v-for="snap in snapshots"
          :key="snap.id"
          class="rounded-xl bg-gray-950 dark:bg-gray-900 border border-gray-800 p-5 font-[SUSE_Mono] text-sm"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-xs uppercase tracking-widest">{{ snap.date }}</span>
              <span class="text-gray-700 text-xs">{{ new Date(snap.createdAt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="snap.data.totalChangePct >= 0 ? 'success' : 'error'"
                variant="soft"
                class="font-[SUSE_Mono] text-xs"
              >{{ snap.data.totalChangePct >= 0 ? '+' : '' }}{{ snap.data.totalChangePct.toFixed(2) }}%</UBadge>
              <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" :loading="deletingId === snap.id" @click="deleteSnapshot(snap.id)" />
            </div>
          </div>

          <!-- JSON body -->
          <div class="space-y-0.5 text-gray-300">
            <div class="text-gray-600">{</div>

            <div class="pl-5 flex justify-between gap-4">
              <span class="text-purple-400">"currency"</span>
              <span class="text-amber-300">"{{ snap.data.currency }}"</span>
            </div>

            <div class="pl-5 flex justify-between gap-4">
              <span class="text-purple-400">"total"</span>
              <span class="text-green-400 font-semibold">{{ snap.data.totalValue.toLocaleString('de-CH') }}</span>
            </div>

            <div class="pl-5 my-1 border-t border-gray-800" />

            <!-- Groups -->
            <div v-for="(g, gi) in snap.data.groups" :key="g.type" class="space-y-0.5">
              <!-- Group header — klickbar zum Auf-/Zuklappen -->
              <div
                class="pl-5 flex items-center justify-between gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                @click="toggleGroup(snap.id, g.type)"
              >
                <div class="flex items-center gap-1.5">
                  <UIcon
                    :name="isGroupOpen(snap.id, g.type) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="w-3 h-3 text-gray-500"
                  />
                  <span class="text-blue-400">"{{ g.type }}"</span>
                </div>
                <span class="text-gray-200 flex items-center gap-2">
                  {{ g.value.toLocaleString('de-CH') }}
                  <span v-if="g.changePct !== undefined" class="text-xs" :class="g.changePct >= 0 ? 'text-green-500' : 'text-red-400'">
                    {{ g.changePct >= 0 ? '+' : '' }}{{ g.changePct.toFixed(2) }}%
                  </span>
                  <span v-if="gi < snap.data.groups.length - 1" class="text-gray-600">,</span>
                </span>
              </div>

              <!-- Positions -->
              <div v-if="isGroupOpen(snap.id, g.type) && g.positions?.length" class="pl-10 space-y-0.5">
                <div class="text-gray-700 text-xs">[</div>
                <div
                  v-for="(pos, pi) in g.positions"
                  :key="pos.symbol ?? pos.name"
                  class="pl-4 flex items-center justify-between gap-4 text-xs"
                >
                  <span class="text-cyan-400 truncate">
                    {{ pos.symbol ? `${pos.symbol}` : pos.name }}
                    <span v-if="pos.symbol && pos.name !== pos.symbol" class="text-gray-600 ml-1">{{ pos.name }}</span>
                    <!-- Metal: quantity + unit -->
                    <span v-if="pos.quantity !== undefined" class="text-gray-500 ml-1">{{ pos.quantity }} {{ pos.unit }}</span>
                  </span>
                  <span class="text-gray-300 flex items-center gap-1.5 shrink-0">
                    {{ pos.value.toLocaleString('de-CH') }}
                    <span v-if="pos.changePct !== undefined" :class="pos.changePct >= 0 ? 'text-green-500' : 'text-red-400'">
                      {{ pos.changePct >= 0 ? '+' : '' }}{{ pos.changePct.toFixed(2) }}%
                    </span>
                    <span v-if="pi < g.positions.length - 1" class="text-gray-700">,</span>
                  </span>
                </div>
                <div class="text-gray-700 text-xs">]</div>
              </div>
            </div>

            <div class="text-gray-600">}</div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data: snapshots, pending, refresh } = await useFetch('/api/finance/snapshot')

const toast = useToast()
const backfillLoading = ref(false)
const rangeFrom = ref('')
const rangeTo = ref('')

function triggerLastMonth() {
  const to = new Date()
  to.setDate(to.getDate() - 1)
  const from = new Date(to)
  from.setMonth(from.getMonth() - 1)
  triggerBackfill(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
}

async function triggerBackfill(from?: string, to?: string) {
  backfillLoading.value = true
  try {
    const body = from && to ? { from, to } : undefined
    const res = await $fetch<{ created: string[]; skipped: string[] }>('/api/finance/snapshot/backfill', { method: 'POST', body })
    await refresh()
    toast.add({
      title: `${res.created.length} Snapshots erstellt`,
      description: res.created.length
        ? res.created.join(', ')
        : res.skipped.length
          ? 'Alle Tage bereits vorhanden'
          : 'Keine neuen Daten',
      color: res.created.length ? 'success' : 'neutral',
    })
  }
  catch {
    toast.add({ title: 'Backfill fehlgeschlagen', color: 'error' })
  }
  finally {
    backfillLoading.value = false
  }
}

const deletingId = ref<string | null>(null)

async function deleteSnapshot(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/finance/snapshot/${id}`, { method: 'DELETE' })
    await refresh()
  }
  finally {
    deletingId.value = null
  }
}

// Track which groups are expanded per snapshot
const openGroups = ref<Record<string, Set<string>>>({})

function toggleGroup(snapId: string, groupType: string) {
  if (!openGroups.value[snapId]) openGroups.value[snapId] = new Set()
  const set = openGroups.value[snapId]
  if (set.has(groupType)) set.delete(groupType)
  else set.add(groupType)
  // trigger reactivity
  openGroups.value = { ...openGroups.value }
}

function isGroupOpen(snapId: string, groupType: string): boolean {
  return openGroups.value[snapId]?.has(groupType) ?? false
}
</script>

<style scoped>
.backfill-date-input {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: inherit;
  outline: none;
}
.backfill-date-input:focus {
  border-color: rgba(255,255,255,0.25);
}
</style>
