<template>
  <NuxtPage v-if="$route.path !== '/settings'" />
  <div v-else class="p-6">
    <div class="max-w-screen-2xl mx-auto space-y-8">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <h1 class="text-2xl font-bold">Einstellungen</h1>
      </div>

      <!-- Firmeninfo -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">Firmeninfo</h2>
          <p class="text-sm text-gray-500 mt-0.5">Allgemeine Informationen zu Ihrem Unternehmen</p>
        </template>

        <div class="space-y-4">
          <UAlert v-if="companyInfoAlert.visible" :color="companyInfoAlert.color" :description="companyInfoAlert.message" @close="companyInfoAlert.visible = false" />

          <UFormField label="Firmenname">
            <UInput v-model="companyForm.name" placeholder="Firmenname" class="w-full" />
          </UFormField>

          <UFormField label="Tel">
            <UInput v-model="companyForm.phone" placeholder="Telefonnummer" class="w-full" />
          </UFormField>

          <UFormField label="Adresse">
            <UTextarea v-model="companyForm.address" placeholder="Adresse" :rows="3" class="w-full" />
          </UFormField>

          <UFormField label="Ansprechpartner">
            <UInput v-model="companyForm.contactPerson" placeholder="Ansprechpartner" class="w-full" />
          </UFormField>

          <UFormField label="Logo">
            <div class="space-y-2">
              <img v-if="companyForm.logoPath" :src="companyForm.logoPath" alt="Firmenlogo" class="h-16 object-contain rounded border border-gray-200 dark:border-gray-700" />
              <div class="flex items-center gap-2">
                <input
                  ref="logoFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="uploadLogo"
                />
                <UButton variant="outline" color="neutral" icon="i-lucide-upload" :loading="uploadingLogo" @click="(logoFileInput as HTMLInputElement)?.click()">
                  Logo hochladen
                </UButton>
                <span v-if="companyForm.logoPath" class="text-sm text-gray-500">Logo vorhanden</span>
              </div>
            </div>
          </UFormField>

          <div class="flex justify-end pt-2">
            <UButton :loading="savingCompanyInfo" @click="saveCompanyInfo">Speichern</UButton>
          </div>
        </div>
      </UCard>

      <!-- Portfolios -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">Portfolios</h2>
          <p class="text-sm text-gray-500 mt-0.5">Verwalte deine Investment-Portfolios</p>
        </template>

        <div class="space-y-4">
          <div class="space-y-2">
            <div v-for="p in portfolios" :key="p.id">
              <!-- Edit-Modus -->
              <div v-if="editingPortfolioId === p.id" class="space-y-3 p-3 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950">
                <UInput v-model="editPortfolio.name" placeholder="Name" class="w-full" autofocus />
                <USelect v-model="editPortfolio.portfolioType" :items="portfolioTypeOptions" placeholder="Typ wählen (optional)" class="w-full" />
                <div>
                  <p class="text-sm text-gray-500 mb-2">Farbe:</p>
                  <div class="flex gap-2 flex-wrap">
                    <button
                      v-for="c in portfolioColors"
                      :key="c.value"
                      type="button"
                      class="w-8 h-8 rounded-full border-3 transition-all hover:scale-110"
                      :style="{ backgroundColor: c.hex, borderColor: editPortfolio.color === c.value ? '#1f2937' : 'transparent' }"
                      :title="c.label"
                      @click="editPortfolio.color = c.value"
                    />
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton size="sm" :loading="savingPortfolio" @click="savePortfolio(p.id)">Speichern</UButton>
                  <UButton size="sm" variant="ghost" color="neutral" @click="editingPortfolioId = null">Abbrechen</UButton>
                </div>
              </div>

              <!-- Normal-Modus -->
              <div v-else class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class="flex items-center gap-3">
                  <span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: portfolioColors.find(c => c.value === p.color)?.hex ?? p.color }" />
                  <span class="font-medium">{{ p.name }}</span>
                  <span v-if="p.portfolioType" class="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{{ p.portfolioType }}</span>
                  <span class="text-xs text-gray-400">{{ p.stockCount }} Aktien · {{ p.metalCount }} Metalle</span>
                </div>
                <div class="flex gap-1">
                  <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startEditPortfolio(p)" />
                  <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingPortfolio === p.id" @click="deletePortfolio(p.id)" />
                </div>
              </div>
            </div>
            <p v-if="portfolios.length === 0" class="text-sm text-gray-400 text-center py-4">Noch keine Portfolios</p>
          </div>

          <USeparator />

          <!-- Neues Portfolio -->
          <form class="space-y-3" @submit.prevent="addPortfolio">
            <div class="flex gap-2">
              <UInput v-model="newPortfolio.name" placeholder="Portfolio-Name" class="flex-1" />
              <UButton type="submit" icon="i-lucide-plus" :loading="addingPortfolio">Hinzufügen</UButton>
            </div>
            <USelect v-model="newPortfolio.portfolioType" :items="portfolioTypeOptions" placeholder="Typ wählen (optional)" class="w-full" />
            <div>
              <p class="text-sm text-gray-500 mb-2">Farbe:</p>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="c in portfolioColors"
                  :key="c.value"
                  type="button"
                  class="w-8 h-8 rounded-full border-3 transition-all hover:scale-110"
                  :style="{ backgroundColor: c.hex, borderColor: newPortfolio.color === c.value ? '#1f2937' : 'transparent' }"
                  :title="c.label"
                  @click="newPortfolio.color = c.value"
                />
              </div>
            </div>
          </form>
          <UAlert v-if="portfolioError" color="error" variant="subtle" :description="portfolioError" />
        </div>
      </UCard>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'page-access'], requiredPage: 'settings' })

// --- Firmeninfo ---
type CompanyInfoData = { id: string; name: string; phone: string; address: string; contactPerson: string; logoPath: string | null }

const companyForm = reactive({
  name: '',
  phone: '',
  address: '',
  contactPerson: '',
  logoPath: null as string | null,
})

const savingCompanyInfo = ref(false)
const uploadingLogo = ref(false)
const logoFileInput = ref<HTMLInputElement | null>(null)
const companyInfoAlert = reactive({ visible: false, color: 'success' as 'success' | 'error', message: '' })

const { data: companyInfoData } = await useFetch<CompanyInfoData>('/api/settings/company')

if (companyInfoData.value) {
  companyForm.name = companyInfoData.value.name
  companyForm.phone = companyInfoData.value.phone
  companyForm.address = companyInfoData.value.address
  companyForm.contactPerson = companyInfoData.value.contactPerson
  companyForm.logoPath = companyInfoData.value.logoPath
}

async function saveCompanyInfo() {
  savingCompanyInfo.value = true
  try {
    const updated = await $fetch<CompanyInfoData>('/api/settings/company', {
      method: 'PUT',
      body: {
        name: companyForm.name,
        phone: companyForm.phone,
        address: companyForm.address,
        contactPerson: companyForm.contactPerson,
      },
    })
    companyForm.logoPath = updated.logoPath
    companyInfoAlert.color = 'success'
    companyInfoAlert.message = 'Firmeninfo gespeichert'
    companyInfoAlert.visible = true
  } catch {
    companyInfoAlert.color = 'error'
    companyInfoAlert.message = 'Fehler beim Speichern'
    companyInfoAlert.visible = true
  } finally {
    savingCompanyInfo.value = false
  }
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingLogo.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ logoPath: string }>('/api/settings/company/logo', {
      method: 'POST',
      body: formData,
    })
    companyForm.logoPath = result.logoPath
    input.value = ''
    companyInfoAlert.color = 'success'
    companyInfoAlert.message = 'Logo hochgeladen'
    companyInfoAlert.visible = true
  } catch {
    companyInfoAlert.color = 'error'
    companyInfoAlert.message = 'Fehler beim Hochladen'
    companyInfoAlert.visible = true
  } finally {
    uploadingLogo.value = false
  }
}

// --- Portfolios ---
type Portfolio = { id: string; name: string; color: string; portfolioType: string; sortOrder: number; stockCount: number; metalCount: number }

const portfolioTypeOptions = [
  { label: 'Aktienportfolio', value: 'Aktienportfolio' },
  { label: 'Säule 3A', value: 'Säule 3A' },
  { label: 'Bankkonto', value: 'Bankkonto' },
  { label: 'Lending', value: 'Lending' },
]

const portfolioColors = [
  { value: 'blue', label: 'Blau', hex: '#3b82f6' },
  { value: 'green', label: 'Grün', hex: '#22c55e' },
  { value: 'yellow', label: 'Gelb', hex: '#f59e0b' },
  { value: 'red', label: 'Rot', hex: '#ef4444' },
  { value: 'purple', label: 'Lila', hex: '#8b5cf6' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'gray', label: 'Grau', hex: '#6b7280' },
]

const { data: portfoliosData, refresh: refreshPortfolios } = await useFetch<Portfolio[]>('/api/portfolios')
const portfolios = computed(() => portfoliosData.value ?? [])

const newPortfolio = reactive({ name: '', color: 'blue', portfolioType: '' })
const addingPortfolio = ref(false)
const portfolioError = ref('')
const editingPortfolioId = ref<string | null>(null)
const editPortfolio = reactive({ name: '', color: '', portfolioType: '' })
const savingPortfolio = ref(false)
const deletingPortfolio = ref<string | null>(null)

function startEditPortfolio(p: Portfolio) {
  editingPortfolioId.value = p.id
  editPortfolio.name = p.name
  editPortfolio.color = p.color
  editPortfolio.portfolioType = p.portfolioType ?? ''
}

async function savePortfolio(id: string) {
  savingPortfolio.value = true
  await $fetch(`/api/portfolios/${id}`, { method: 'PATCH', body: { name: editPortfolio.name, color: editPortfolio.color, portfolioType: editPortfolio.portfolioType } })
  editingPortfolioId.value = null
  savingPortfolio.value = false
  await refreshPortfolios()
}

async function addPortfolio() {
  portfolioError.value = ''
  if (!newPortfolio.name.trim()) return
  addingPortfolio.value = true
  try {
    await $fetch('/api/portfolios', { method: 'POST', body: { name: newPortfolio.name, color: newPortfolio.color, portfolioType: newPortfolio.portfolioType } })
    newPortfolio.name = ''
    newPortfolio.color = 'blue'
    newPortfolio.portfolioType = ''
    await refreshPortfolios()
  } catch (e: any) {
    portfolioError.value = e?.data?.message ?? 'Fehler'
  } finally {
    addingPortfolio.value = false
  }
}

async function deletePortfolio(id: string) {
  deletingPortfolio.value = id
  await $fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
  deletingPortfolio.value = null
  await refreshPortfolios()
}
</script>
