<template>
  <div class="p-6">
    <div class="max-w-screen-xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/settings" />
        <div v-if="customer" class="flex-1 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Berechnungsschema</h1>
            <p class="text-sm text-gray-400 mt-0.5">{{ customer.name }}</p>
          </div>
          <!-- Währung (global pro Kunde) -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">Währung</span>
            <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                v-for="c in ['EUR', 'CHF']"
                :key="c"
                type="button"
                class="px-3 py-1.5 text-sm font-medium transition-colors"
                :class="currency === c
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="setCurrency(c)"
              >
                {{ c }}
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="pending" class="space-y-1">
          <div class="h-7 w-52 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div class="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      <!-- Schritt 1: Produkt wählen -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Produkt wählen</h2>
        </template>

        <div v-if="products.length === 0" class="text-sm text-gray-400 py-4 text-center">
          Diesem Kunden sind noch keine Produkte zugewiesen.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="p in products"
            :key="p.id"
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
            :class="selectedProductId === p.id
              ? 'bg-primary-100 dark:bg-primary-900 border-primary-400 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="selectProduct(p)"
          >
            <UIcon name="i-lucide-package" class="w-4 h-4" />
            {{ p.name }}
          </button>
        </div>
      </UCard>

      <!-- Schritt 2: Produktart wählen -->
      <UCard v-if="selectedProduct">
        <template #header>
          <h2 class="font-semibold">Produktart wählen</h2>
          <p class="text-sm text-gray-400 mt-0.5">{{ selectedProduct.name }}</p>
        </template>

        <div v-if="selectedProductTypes.length === 0" class="text-sm text-gray-400 py-4 text-center">
          Diesem Produkt sind noch keine Produktarten zugewiesen.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="pt in selectedProductTypes"
            :key="pt.id"
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="openSchemaModal(pt)"
          >
            <UIcon name="i-lucide-tag" class="w-4 h-4" />
            {{ pt.name }}
          </button>
        </div>
      </UCard>

    </div>

    <!-- Schema Modal -->
    <UModal
      v-if="modalProductType"
      v-model:open="modalOpen"
      :title="`${selectedProduct?.name} · ${modalProductType.name}`"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>

        <!-- Phase tabs -->
        <div v-if="phases.length > 0" class="flex gap-1 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 mb-4 overflow-x-auto">
          <button
            v-for="phase in phases"
            :key="phase.id"
            type="button"
            class="px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px"
            :class="activePhaseId === phase.id
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'"
            @click="activePhaseId = phase.id"
          >
            {{ phase.name }}
          </button>
        </div>
        <div v-else class="text-sm text-gray-400 text-center py-2 mb-4">
          Keine Phasen vorhanden.
        </div>

        <!-- Loading -->
        <div v-if="schemaLoading" class="flex justify-center py-10">
          <UIcon name="i-lucide-loader-circle" class="w-6 h-6 text-gray-400 animate-spin" />
        </div>

        <!-- Entries for active phase -->
        <div v-else-if="activePhaseId" class="space-y-5">

          <!-- Default section: full functionality -->
          <div class="space-y-0">
            <template v-for="(entry, subIdx) in activeEntriesForSubcategory(null)" :key="entry.id">
              <div
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all"
                :class="[
                  draggingSubIndex === subIdx ? 'opacity-40' : 'opacity-100',
                  dragOverSubIndex === subIdx ? 'border-primary-400 bg-primary-50 dark:bg-primary-950' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
                ]"
                draggable="true"
                @dragstart="onDragStart(null, subIdx, $event)"
                @dragover.prevent="onDragOver(null, subIdx)"
                @drop.prevent="onDrop(null, subIdx)"
                @dragend="onDragEnd"
              >
                <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 text-gray-400 cursor-grab shrink-0" />
                <select v-model="entry.type" class="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer">
                  <option value="Pauschale">Pauschale</option>
                  <option value="Zeit">Zeit</option>
                  <option value="Entwurf">Entwurf</option>
                  <option value="Ausfall">Ausfall</option>
                </select>
                <template v-if="entry.type === 'Pauschale'">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-gray-500 shrink-0">Max</span>
                    <input v-model.number="entry.max" type="number" min="0" placeholder="—" class="w-16 px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div v-if="entry.max !== null && entry.max !== undefined && entry.max !== ('' as any)" class="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                    <button v-for="opt in ['Anzahl', 'Zeit']" :key="opt" type="button" class="px-2 py-1 text-xs font-medium transition-colors" :class="entry.maxUnit === opt ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'" @click="entry.maxUnit = opt as 'Anzahl' | 'Zeit'">{{ opt }}</button>
                  </div>
                  <div class="flex items-center gap-1 text-gray-400 shrink-0">
                    <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
                    <span class="text-xs">Inklusive</span>
                  </div>
                </template>
                <template v-if="entry.type === 'Ausfall'">
                  <div class="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                    <button v-for="mod in ['%', 'Betrag']" :key="mod" type="button" class="px-2 py-1 text-xs font-medium transition-colors" :class="entry.ausfallModus === mod ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'" @click="entry.ausfallModus = mod as '%' | 'Betrag'">{{ mod }}</button>
                  </div>
                  <div v-if="entry.ausfallModus === '%'" class="flex items-center gap-1">
                    <input v-model.number="entry.ausfallWert" type="number" min="0" max="100" step="0.1" placeholder="0" class="w-16 px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <span class="text-sm text-gray-500">%</span>
                  </div>
                  <div v-else class="flex items-center gap-1.5">
                    <span class="text-sm text-gray-500 shrink-0">{{ currency }}</span>
                    <input v-model.number="entry.geld" type="number" min="0" step="0.01" placeholder="0.00" class="w-20 px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </template>
                <div v-if="entry.type !== 'Ausfall'" class="flex items-center gap-1.5">
                  <span class="text-sm text-gray-500 shrink-0">{{ currency }}</span>
                  <input v-model.number="entry.geld" type="number" min="0" step="0.01" placeholder="0.00" class="w-20 px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" class="ml-auto shrink-0" @click="removeEntry(entry.id)" />
              </div>

              <!-- Arrow connector -->
              <div v-if="subIdx < activeEntriesForSubcategory(null).length - 1" class="flex flex-col items-center py-1">
                <div class="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 -mt-0.5" />
              </div>
            </template>

            <!-- Empty state -->
            <div v-if="activeEntriesForSubcategory(null).length === 0" class="text-sm text-gray-400 py-8 text-center">
              Noch keine Einträge für diese Phase.
            </div>

            <!-- Add button -->
            <div class="flex justify-center" :class="activeEntriesForSubcategory(null).length > 0 ? 'mt-3' : 'mt-1'">
              <button
                type="button"
                class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 transition-colors"
                @click="addEntry(null)"
              >
                <UIcon name="i-lucide-plus" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- EXTRA section: one block per subcategory, price field only -->
          <div v-if="activePhaseSubcategories.length > 0" class="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 px-1">Extra</p>

            <div v-for="sub in activePhaseSubcategories" :key="sub.id" class="space-y-1.5">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">{{ sub.name }}</p>

              <div v-for="entry in activeEntriesForSubcategory(sub.id)" :key="entry.id" class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <span class="text-sm text-gray-500 shrink-0">{{ currency }}</span>
                <input
                  :value="entry.geld ?? ''"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @input="(e) => setExtraGeld(entry.id, (e.target as HTMLInputElement).valueAsNumber)"
                />
                <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" class="shrink-0" @click="removeEntry(entry.id)" />
              </div>

              <div v-if="activeEntriesForSubcategory(sub.id).length === 0" class="flex justify-center">
                <button
                  type="button"
                  class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 transition-colors"
                  @click="addEntry(sub.id)"
                >
                  <UIcon name="i-lucide-plus" class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex justify-center mt-1">
                <button
                  type="button"
                  class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 transition-colors"
                  @click="addEntry(sub.id)"
                >
                  <UIcon name="i-lucide-plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" :disabled="schemaSaving" @click="modalOpen = false">Schließen</UButton>
          <UButton :loading="schemaSaving" @click="saveSchema">Speichern</UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'page-access'], requiredPage: 'settings' })

const route = useRoute()
const customerId = route.params.id as string

type Customer = { id: string; name: string; currency: string }
type ProductType = { id: string; name: string }
type Product = { id: string; name: string; productTypeIds: string[]; typeIds: string[] }
type Phase = { id: string; name: string; sortOrder: number; typeIds: string[]; subcategories: { id: string; name: string }[] }

const { data: customer, pending } = await useFetch<Customer>(`/api/settings/customers/${customerId}`)
const { data: productsData } = await useFetch<Product[]>(`/api/settings/customers/${customerId}/products`)
const { data: allProductTypesData } = await useFetch<ProductType[]>('/api/settings/product-types')
const { data: phasesData } = await useFetch<Phase[]>('/api/settings/phases')

const products = computed(() => productsData.value ?? [])
const allProductTypes = computed(() => allProductTypesData.value ?? [])
const allPhases = computed(() => phasesData.value ?? [])

const phases = computed(() => {
  if (!selectedProduct.value) return allPhases.value
  const productTypeIds = new Set(selectedProduct.value.typeIds)
  return allPhases.value.filter(p => p.typeIds.some(id => productTypeIds.has(id)))
})

// Currency (global per customer)
const currency = ref<string>(customer.value?.currency ?? 'EUR')
watch(() => customer.value?.currency, v => { if (v) currency.value = v })

async function setCurrency(c: string) {
  currency.value = c
  await $fetch(`/api/settings/customers/${customerId}`, {
    method: 'PATCH',
    body: { currency: c },
  })
}

const selectedProductId = ref<string | null>(null)
const selectedProduct = computed(() => products.value.find(p => p.id === selectedProductId.value) ?? null)

const selectedProductTypes = computed(() => {
  if (!selectedProduct.value) return []
  return allProductTypes.value.filter(pt => selectedProduct.value!.productTypeIds.includes(pt.id))
})

function selectProduct(p: Product) {
  selectedProductId.value = p.id
}

// Modal
const modalOpen = ref(false)
const modalProductType = ref<ProductType | null>(null)

// Active phase tab
const activePhaseId = ref<string | null>(null)

const schemaLoading = ref(false)

async function openSchemaModal(pt: ProductType) {
  modalProductType.value = pt
  entriesByPhase.value = {}
  activePhaseId.value = phases.value[0]?.id ?? null
  modalOpen.value = true

  if (!selectedProduct.value) return
  schemaLoading.value = true
  try {
    const data = await $fetch<Record<string, any[]>>(`/api/settings/customers/${customerId}/schema`, {
      query: { productId: selectedProduct.value.id, productTypeId: pt.id },
    })
    entriesByPhase.value = data ?? {}
  } finally {
    schemaLoading.value = false
  }
}

// Schema entries per phase
type SchemaEntryType = 'Pauschale' | 'Zeit' | 'Entwurf' | 'Ausfall'
type SchemaEntry = { id: string; type: SchemaEntryType; max: number | null; maxUnit: 'Anzahl' | 'Zeit'; geld: number | null; ausfallWert: number | null; ausfallModus: '%' | 'Betrag'; subcategoryId: string | null }

const entriesByPhase = ref<Record<string, SchemaEntry[]>>({})

const activePhaseSubcategories = computed(() => {
  if (!activePhaseId.value) return []
  return allPhases.value.find(p => p.id === activePhaseId.value)?.subcategories ?? []
})

const activeEntries = computed<SchemaEntry[]>(() => {
  if (!activePhaseId.value) return []
  if (!entriesByPhase.value[activePhaseId.value]) {
    entriesByPhase.value[activePhaseId.value] = []
  }
  return entriesByPhase.value[activePhaseId.value]!
})

function activeEntriesForSubcategory(subcategoryId: string | null): SchemaEntry[] {
  if (!activePhaseId.value) return []
  return (entriesByPhase.value[activePhaseId.value] ?? []).filter(e => (e.subcategoryId ?? null) === subcategoryId)
}


function addEntry(subcategoryId: string | null = null) {
  if (!activePhaseId.value) return
  if (!entriesByPhase.value[activePhaseId.value]) {
    entriesByPhase.value[activePhaseId.value] = []
  }
  entriesByPhase.value[activePhaseId.value]!.push({
    id: crypto.randomUUID(),
    type: 'Pauschale',
    max: null,
    maxUnit: 'Anzahl',
    geld: null,
    ausfallWert: null,
    ausfallModus: '%',
    subcategoryId,
  })
}

function setExtraGeld(entryId: string, value: number) {
  if (!activePhaseId.value) return
  const list = entriesByPhase.value[activePhaseId.value]
  if (!list) return
  const entry = list.find(e => e.id === entryId)
  if (entry) entry.geld = isNaN(value) ? null : value
}

function removeEntry(entryId: string) {
  if (!activePhaseId.value) return
  const list = entriesByPhase.value[activePhaseId.value]
  if (!list) return
  const i = list.findIndex(e => e.id === entryId)
  if (i !== -1) list.splice(i, 1)
}

// Drag and drop — per subcategory section
const draggingSectionKey = ref<string | null>(null)
const draggingSubIndex = ref<number | null>(null)
const dragOverSubIndex = ref<number | null>(null)

function onDragStart(sectionKey: string | null, subIndex: number, event: DragEvent) {
  draggingSectionKey.value = sectionKey
  draggingSubIndex.value = subIndex
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(sectionKey: string | null, subIndex: number) {
  if (draggingSectionKey.value !== sectionKey) return
  dragOverSubIndex.value = subIndex
}

function onDrop(sectionKey: string | null, targetSubIndex: number) {
  if (draggingSubIndex.value === null || draggingSectionKey.value !== sectionKey) return
  const fromSubIndex = draggingSubIndex.value
  if (fromSubIndex === targetSubIndex) return
  const list = entriesByPhase.value[activePhaseId.value!]
  if (!list) return
  // Reorder within section only
  const sectionEntries = list.filter(e => (e.subcategoryId ?? null) === sectionKey)
  const [moved] = sectionEntries.splice(fromSubIndex, 1)
  sectionEntries.splice(targetSubIndex, 0, moved!)
  // Rebuild flat list preserving order of other sections
  let sIdx = 0
  for (let i = 0; i < list.length; i++) {
    if ((list[i]!.subcategoryId ?? null) === sectionKey) list[i] = sectionEntries[sIdx++]!
  }
  draggingSubIndex.value = null
  dragOverSubIndex.value = null
}

function onDragEnd() {
  draggingSectionKey.value = null
  draggingSubIndex.value = null
  dragOverSubIndex.value = null
}

const schemaSaving = ref(false)

async function saveSchema() {
  if (!selectedProduct.value || !modalProductType.value) return
  schemaSaving.value = true
  try {
    await $fetch(`/api/settings/customers/${customerId}/schema`, {
      method: 'PUT',
      body: {
        productId: selectedProduct.value.id,
        productTypeId: modalProductType.value.id,
        entries: entriesByPhase.value,
      },
    })
    modalOpen.value = false
  } finally {
    schemaSaving.value = false
  }
}
</script>
