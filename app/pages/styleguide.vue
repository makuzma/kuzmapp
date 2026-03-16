<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
    <div class="max-w-screen-2xl mx-auto space-y-10">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <div>
          <h1 class="text-3xl font-bold">Styleguide</h1>
          <p class="text-sm text-gray-500 mt-0.5">Design-System & Globale Styles</p>
        </div>
      </div>

      <!-- DESIGN TOKENS (EDITABLE) -->
      <section class="space-y-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-semibold">Design Tokens</h2>
          <span class="text-sm font-normal text-gray-400">— Live editierbar</span>
        </div>
        <UCard>
          <div class="space-y-8">

            <!-- Primary Color -->
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Primärfarbe</p>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">Basis (500):</span>
                  <label class="relative cursor-pointer flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" :style="{ backgroundColor: primaryShades[5]!.value }" />
                    <input
                      type="color"
                      :value="primaryShades[5]!.value"
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      @input="(e) => onBaseColorChange((e.target as HTMLInputElement).value)"
                    />
                    <code class="text-xs font-mono text-gray-500">{{ primaryShades[5]!.value }}</code>
                  </label>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <div v-for="(shade, idx) in primaryShades" :key="shade.label" class="flex flex-col items-center gap-1.5">
                  <label class="relative cursor-pointer group">
                    <div
                      class="w-12 h-10 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                      :style="{ backgroundColor: shade.value }"
                    />
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UIcon name="i-lucide-pipette" class="w-3.5 h-3.5 text-white drop-shadow" />
                    </div>
                    <input
                      type="color"
                      :value="shade.value"
                      class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      @input="(e) => updateShade(idx, (e.target as HTMLInputElement).value)"
                    />
                  </label>
                  <p class="text-xs text-gray-500 font-medium">{{ shade.label }}</p>
                  <p class="text-xs font-mono text-gray-400">{{ shade.value }}</p>
                </div>
              </div>
            </div>

            <USeparator />

            <!-- CSS Output -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Generiertes CSS</p>
                <div class="flex gap-2">
                  <UButton size="xs" variant="outline" color="neutral" icon="i-lucide-rotate-ccw" @click="resetToDefaults">
                    Zurücksetzen
                  </UButton>
                  <UButton size="xs" icon="i-lucide-copy" @click="copyCss">
                    {{ copied ? 'Kopiert!' : 'CSS kopieren' }}
                  </UButton>
                </div>
              </div>
              <pre class="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto leading-relaxed text-gray-600 dark:text-gray-300 select-all">{{ generatedCss }}</pre>
              <p class="text-xs text-gray-400">
                Diesen Block in <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">assets/css/main.css</code> einsetzen um Änderungen global anzuwenden.
              </p>
            </div>

          </div>
        </UCard>
      </section>

      <!-- FARBEN -->
      <section class="space-y-4">
        <SectionTitle>Farben</SectionTitle>
        <UCard>
          <div class="space-y-6">

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Brand / Primary (live)</p>
              <div class="flex flex-wrap gap-2">
                <div v-for="shade in primaryShades" :key="shade.label" class="flex flex-col items-center gap-1">
                  <div class="w-10 h-10 rounded-lg shadow-sm transition-colors" :style="{ backgroundColor: shade.value }" />
                  <p class="text-xs text-gray-400">{{ shade.label }}</p>
                </div>
              </div>
            </div>

            <USeparator />

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Neutral / Gray</p>
              <div class="flex flex-wrap gap-2">
                <ColorSwatch v-for="shade in [50,100,200,300,400,500,600,700,800,900,950]" :key="shade" :class="`bg-gray-${shade}`" :label="`gray-${shade}`" />
              </div>
            </div>

            <USeparator />

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Status-Farben</p>
              <div class="flex flex-wrap gap-3">
                <div v-for="color in statusColors" :key="color.name" class="space-y-1 text-center">
                  <div class="w-16 h-10 rounded-lg" :style="{ backgroundColor: color.hex }" />
                  <p class="text-xs text-gray-500">{{ color.name }}</p>
                  <p class="text-xs font-mono text-gray-400">{{ color.hex }}</p>
                </div>
              </div>
            </div>

          </div>
        </UCard>
      </section>

      <!-- TYPOGRAFIE -->
      <section class="space-y-4">
        <SectionTitle>Typografie</SectionTitle>
        <UCard>
          <div class="space-y-6">

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Überschriften</p>
              <div class="space-y-2 divide-y divide-gray-100 dark:divide-gray-800">
                <div class="flex items-baseline gap-6 py-2 first:pt-0">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-3xl bold</span>
                  <p class="text-3xl font-bold">Seitenüberschrift</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-2xl bold</span>
                  <p class="text-2xl font-bold">Haupttitel</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-xl semibold</span>
                  <p class="text-xl font-semibold">Abschnittstitel</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-lg semibold</span>
                  <p class="text-lg font-semibold">Kartentitel</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-base medium</span>
                  <p class="text-base font-medium">Feldbezeichnung</p>
                </div>
              </div>
            </div>

            <USeparator />

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Fließtext</p>
              <div class="space-y-2 divide-y divide-gray-100 dark:divide-gray-800">
                <div class="flex items-baseline gap-6 py-2 first:pt-0">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-base</span>
                  <p class="text-base">Normaler Text — Lorem ipsum dolor sit amet consectetur.</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-sm</span>
                  <p class="text-sm">Kleintext — Beschreibungen und Metadaten.</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-sm gray-500</span>
                  <p class="text-sm text-gray-500">Sekundärer Text — Ergänzende Informationen.</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">text-xs gray-400</span>
                  <p class="text-xs text-gray-400">Labels & Hinweise — Zeitstempel, Metainfo.</p>
                </div>
                <div class="flex items-baseline gap-6 py-2">
                  <span class="w-28 text-xs text-gray-400 shrink-0">uppercase label</span>
                  <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Abschnittsbezeichnung</p>
                </div>
              </div>
            </div>

          </div>
        </UCard>
      </section>

      <!-- BUTTONS -->
      <section class="space-y-4">
        <SectionTitle>Buttons</SectionTitle>
        <UCard>
          <div class="space-y-6">

            <div v-for="color in buttonColors" :key="color" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ color }}</p>
              <div class="flex flex-wrap gap-2 items-center">
                <UButton :color="color as any" variant="solid" size="sm">Solid</UButton>
                <UButton :color="color as any" variant="outline" size="sm">Outline</UButton>
                <UButton :color="color as any" variant="soft" size="sm">Soft</UButton>
                <UButton :color="color as any" variant="subtle" size="sm">Subtle</UButton>
                <UButton :color="color as any" variant="ghost" size="sm">Ghost</UButton>
                <UButton :color="color as any" variant="link" size="sm">Link</UButton>
              </div>
            </div>

            <USeparator />

            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Grössen</p>
              <div class="flex flex-wrap gap-2 items-center">
                <UButton size="xs">Extra Small</UButton>
                <UButton size="sm">Small</UButton>
                <UButton size="md">Medium</UButton>
                <UButton size="lg">Large</UButton>
                <UButton size="xl">Extra Large</UButton>
              </div>
            </div>

            <USeparator />

            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Mit Icons</p>
              <div class="flex flex-wrap gap-2 items-center">
                <UButton icon="i-lucide-plus" size="sm">Hinzufügen</UButton>
                <UButton icon="i-lucide-pencil" variant="outline" color="neutral" size="sm">Bearbeiten</UButton>
                <UButton icon="i-lucide-trash-2" variant="outline" color="error" size="sm">Löschen</UButton>
                <UButton icon="i-lucide-save" variant="soft" size="sm">Speichern</UButton>
                <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm">Zurück</UButton>
                <UButton icon="i-lucide-settings" variant="ghost" color="neutral" size="sm" />
              </div>
            </div>

            <USeparator />

            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Zustände</p>
              <div class="flex flex-wrap gap-2 items-center">
                <UButton loading size="sm">Laden...</UButton>
                <UButton disabled size="sm">Deaktiviert</UButton>
                <UButton loading variant="outline" color="neutral" size="sm">Speichern...</UButton>
              </div>
            </div>

          </div>
        </UCard>
      </section>

      <!-- BADGES -->
      <section class="space-y-4">
        <SectionTitle>Badges</SectionTitle>
        <UCard>
          <div class="space-y-4">
            <div v-for="variant in ['solid', 'subtle', 'outline', 'soft']" :key="variant" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ variant }}</p>
              <div class="flex flex-wrap gap-2">
                <UBadge v-for="color in badgeColors" :key="color" :color="color as any" :variant="variant as any" size="sm">{{ color }}</UBadge>
              </div>
            </div>
            <USeparator />
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Grössen</p>
              <div class="flex flex-wrap gap-2 items-center">
                <UBadge size="sm">Small</UBadge>
                <UBadge size="md">Medium</UBadge>
                <UBadge size="lg">Large</UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <!-- INPUTS -->
      <section class="space-y-4">
        <SectionTitle>Inputs & Felder</SectionTitle>
        <UCard>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <UFormField label="Text Input">
              <UInput placeholder="Platzhalter..." class="w-full" />
            </UFormField>

            <UFormField label="Mit Icon">
              <UInput icon="i-lucide-search" placeholder="Suchen..." class="w-full" />
            </UFormField>

            <UFormField label="Datum">
              <UInput type="date" class="w-full" />
            </UFormField>

            <UFormField label="Deaktiviert">
              <UInput value="Nicht editierbar" disabled class="w-full" />
            </UFormField>

            <UFormField label="Textarea" class="sm:col-span-2">
              <UTextarea placeholder="Mehrzeiliger Text..." class="w-full" />
            </UFormField>

            <UFormField label="Select">
              <USelect :items="['Option A', 'Option B', 'Option C']" placeholder="Wählen..." class="w-full" />
            </UFormField>

            <UFormField label="Grössen" class="sm:col-span-2">
              <div class="flex flex-wrap gap-2 items-center">
                <UInput size="xs" placeholder="xs" class="w-24" />
                <UInput size="sm" placeholder="sm" class="w-24" />
                <UInput size="md" placeholder="md" class="w-24" />
                <UInput size="lg" placeholder="lg" class="w-24" />
                <UInput size="xl" placeholder="xl" class="w-24" />
              </div>
            </UFormField>

          </div>
        </UCard>
      </section>

      <!-- ALERTS -->
      <section class="space-y-4">
        <SectionTitle>Alerts</SectionTitle>
        <UCard>
          <div class="space-y-3">
            <UAlert v-for="color in alertColors" :key="color" :color="color as any" variant="subtle" :title="color" :description="`Dies ist ein ${color}-Alert mit einer kurzen Beschreibung.`" />
          </div>
        </UCard>
      </section>

      <!-- CARDS -->
      <section class="space-y-4">
        <SectionTitle>Cards</SectionTitle>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <UCard>
            <template #header>
              <h3 class="font-semibold">Standard Card</h3>
              <p class="text-sm text-gray-500">Mit Header und Body</p>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">Card-Inhalt mit normalem Text.</p>
            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton variant="ghost" color="neutral" size="sm">Abbrechen</UButton>
                <UButton size="sm">Speichern</UButton>
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">Aktions-Card</h3>
            </template>
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="font-medium">Funktion</p>
                <p class="text-sm text-gray-500">Kurze Beschreibung</p>
              </div>
              <UButton variant="outline" color="neutral" icon="i-lucide-arrow-right" size="sm">Öffnen</UButton>
            </div>
          </UCard>

        </div>
      </section>

      <!-- AVATARE -->
      <section class="space-y-4">
        <SectionTitle>Avatare</SectionTitle>
        <UCard>
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Grössen</p>
              <div class="flex flex-wrap gap-4 items-end">
                <div v-for="size in ['3xs','2xs','xs','sm','md','lg','xl','2xl']" :key="size" class="text-center space-y-1">
                  <UAvatar alt="Max Mustermann" :size="size as any" />
                  <p class="text-xs text-gray-400">{{ size }}</p>
                </div>
              </div>
            </div>
            <USeparator />
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Mit Online-Indikator</p>
              <div class="flex gap-4">
                <div class="relative">
                  <UAvatar alt="Online" size="md" />
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
                </div>
                <div class="relative">
                  <UAvatar alt="Offline" size="md" />
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-400 ring-2 ring-white dark:ring-gray-900" />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <!-- ICONS -->
      <section class="space-y-4">
        <SectionTitle>Icons (Lucide)</SectionTitle>
        <UCard>
          <div class="flex flex-wrap gap-4">
            <div v-for="icon in commonIcons" :key="icon.name" class="flex flex-col items-center gap-1.5 w-16 text-center">
              <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <UIcon :name="icon.value" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <p class="text-xs text-gray-400 leading-tight">{{ icon.name }}</p>
            </div>
          </div>
        </UCard>
      </section>

      <!-- SPACING / LAYOUT -->
      <section class="space-y-4">
        <SectionTitle>Abstände & Layout</SectionTitle>
        <UCard>
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Padding / Gap Skala</p>
              <div class="flex flex-wrap gap-2 items-end">
                <div v-for="s in [1,2,3,4,5,6,8,10,12]" :key="s" class="flex flex-col items-center gap-1">
                  <div class="bg-primary-200 dark:bg-primary-900 rounded" :style="{ width: `${s * 4}px`, height: `${s * 4}px` }" />
                  <p class="text-xs text-gray-400">{{ s }}</p>
                </div>
              </div>
            </div>
            <USeparator />
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Border Radius</p>
              <div class="flex flex-wrap gap-3 items-end">
                <div v-for="r in radiusExamples" :key="r.label" class="flex flex-col items-center gap-1">
                  <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 border-2 border-primary-300 dark:border-primary-700" :class="r.class" />
                  <p class="text-xs text-gray-400">{{ r.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// Inline helper components
const SectionTitle = defineComponent({
  template: `<h2 class="text-xl font-semibold"><slot /></h2>`,
})

const ColorSwatch = defineComponent({
  props: { label: String },
  template: `
    <div class="flex flex-col items-center gap-1">
      <div class="w-10 h-10 rounded-lg shadow-sm" :class="$attrs.class" />
      <p class="text-xs text-gray-400 whitespace-nowrap">{{ label?.split('-')[1] }}</p>
    </div>
  `,
  inheritAttrs: false,
})

// ── Color utilities ──────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100; s /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Lightness + saturation targets for each shade (Tailwind-inspired)
const shadeConfig = [
  { label: '50',  l: 97, sMult: 0.25 },
  { label: '100', l: 94, sMult: 0.35 },
  { label: '200', l: 88, sMult: 0.55 },
  { label: '300', l: 80, sMult: 0.75 },
  { label: '400', l: 70, sMult: 0.90 },
  { label: '500', l: 60, sMult: 1.00 },
  { label: '600', l: 50, sMult: 1.00 },
  { label: '700', l: 41, sMult: 0.95 },
  { label: '800', l: 33, sMult: 0.90 },
  { label: '900', l: 27, sMult: 0.85 },
  { label: '950', l: 17, sMult: 0.80 },
]

function generateScale(base500: string) {
  const [h, s] = hexToHsl(base500)
  return shadeConfig.map(cfg => ({
    label: cfg.label,
    value: cfg.label === '500' ? base500 : hslToHex(h, Math.min(s * cfg.sMult, 100), cfg.l),
  }))
}

// ── State ────────────────────────────────────────────────────────────────────

const defaultBase = '#3b82f6'
const defaults = [
  '#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa',
  '#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a','#172554',
]

const primaryShades = ref(shadeConfig.map((cfg, i) => ({ label: cfg.label, value: defaults[i]! })))
const copied = ref(false)

function onBaseColorChange(hex: string) {
  primaryShades.value = generateScale(hex)
  applyColors()
}

function updateShade(idx: number, value: string) {
  primaryShades.value[idx]!.value = value
  applyColors()
}

function applyColors() {
  if (import.meta.client) {
    const root = document.documentElement
    const numbers = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    primaryShades.value.forEach((shade, i) => {
      root.style.setProperty(`--ui-color-primary-${numbers[i]}`, shade.value)
    })
  }
}

function resetToDefaults() {
  primaryShades.value = shadeConfig.map((cfg, i) => ({ label: cfg.label, value: defaults[i]! }))
  if (import.meta.client) {
    const root = document.documentElement
    const numbers = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    numbers.forEach(n => root.style.removeProperty(`--ui-color-primary-${n}`))
  }
}

const generatedCss = computed(() => {
  const lines = primaryShades.value.map(s => `  --ui-color-primary-${s.label}: ${s.value};`)
  return `:root, .dark {\n${lines.join('\n')}\n}`
})

async function copyCss() {
  await navigator.clipboard.writeText(generatedCss.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

// ── Static data ──────────────────────────────────────────────────────────────

const statusColors = [
  { name: 'Primary', hex: '#3b82f6' },
  { name: 'Success', hex: '#22c55e' },
  { name: 'Warning', hex: '#f59e0b' },
  { name: 'Error', hex: '#ef4444' },
  { name: 'Info', hex: '#06b6d4' },
  { name: 'Neutral', hex: '#6b7280' },
]

const buttonColors = ['primary', 'neutral', 'success', 'warning', 'error', 'info']
const badgeColors = ['primary', 'neutral', 'success', 'warning', 'error', 'info']
const alertColors = ['primary', 'success', 'warning', 'error', 'info', 'neutral']

const commonIcons = [
  { name: 'Plus', value: 'i-lucide-plus' },
  { name: 'Pencil', value: 'i-lucide-pencil' },
  { name: 'Trash', value: 'i-lucide-trash-2' },
  { name: 'Save', value: 'i-lucide-save' },
  { name: 'Search', value: 'i-lucide-search' },
  { name: 'Settings', value: 'i-lucide-settings' },
  { name: 'User', value: 'i-lucide-user' },
  { name: 'Users', value: 'i-lucide-users' },
  { name: 'Arrow Left', value: 'i-lucide-arrow-left' },
  { name: 'Arrow Right', value: 'i-lucide-arrow-right' },
  { name: 'Check', value: 'i-lucide-check' },
  { name: 'X', value: 'i-lucide-x' },
  { name: 'Folder', value: 'i-lucide-folder' },
  { name: 'Calendar', value: 'i-lucide-calendar' },
  { name: 'Clock', value: 'i-lucide-clock' },
  { name: 'Timer', value: 'i-lucide-timer' },
  { name: 'Send', value: 'i-lucide-send' },
  { name: 'Message', value: 'i-lucide-message-circle' },
  { name: 'Image', value: 'i-lucide-image' },
  { name: 'Tag', value: 'i-lucide-tag' },
  { name: 'Star', value: 'i-lucide-star' },
  { name: 'Zap', value: 'i-lucide-zap' },
  { name: 'Grip', value: 'i-lucide-grip-vertical' },
  { name: 'ChevDown', value: 'i-lucide-chevron-down' },
]

const radiusExamples = [
  { label: 'none', class: 'rounded-none' },
  { label: 'sm', class: 'rounded-sm' },
  { label: 'md', class: 'rounded-md' },
  { label: 'lg', class: 'rounded-lg' },
  { label: 'xl', class: 'rounded-xl' },
  { label: 'full', class: 'rounded-full' },
]
</script>
