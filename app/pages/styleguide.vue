<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
    <div class="max-w-screen-2xl mx-auto space-y-10">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <div>
          <h1 class="text-5xl italic font-instrument">Styleguide</h1>
          <p class="text-sm text-gray-500 mt-0.5">Design-System & Globale Styles</p>
        </div>
      </div>

      <!-- DESIGN TOKENS (EDITABLE) -->
      <section class="space-y-4">
        <div class="flex items-center gap-2">
          <h2 class="text-[1.925rem] italic font-instrument">Design Tokens</h2>
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
                    <code class="text-xs font-suse-mono text-gray-500">{{ primaryShades[5]!.value }}</code>
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
                  <p class="text-xs text-gray-500 font-medium font-suse-mono">{{ shade.label }}</p>
                  <p class="text-xs font-suse-mono text-gray-400">{{ shade.value }}</p>
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
              <pre class="text-xs font-suse-mono bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto leading-relaxed text-gray-600 dark:text-gray-300 select-all">{{ generatedCss }}</pre>
              <p class="text-xs text-gray-400">
                Diesen Block in <code class="font-suse-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">assets/css/main.css</code> einsetzen um Änderungen global anzuwenden.
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
                  <p class="text-xs font-suse-mono text-gray-400">{{ color.hex }}</p>
                </div>
              </div>
            </div>

          </div>
        </UCard>
      </section>

      <!-- TYPOGRAFIE -->
      <section class="space-y-4">
        <SectionTitle>Typografie</SectionTitle>

        <!-- Fonts -->
        <UCard>
          <div class="space-y-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Schriftarten</p>
            <div class="space-y-5 divide-y divide-gray-100 dark:divide-gray-800">

              <div class="flex items-start gap-6 pt-5 first:pt-0">
                <div class="w-40 shrink-0">
                  <p class="text-xs text-gray-400 font-mono">Instrument Serif</p>
                  <p class="text-xs text-gray-400">Überschriften · italic</p>
                </div>
                <div>
                  <p class="text-4xl italic font-instrument">Finance Dashboard</p>
                  <p class="text-2xl italic font-instrument text-gray-500 mt-1">Abschnittstitel & Highlights</p>
                </div>
              </div>

              <div class="flex items-start gap-6 pt-5">
                <div class="w-40 shrink-0">
                  <p class="text-xs text-gray-400 font-mono">SUSE</p>
                  <p class="text-xs text-gray-400">UI-Text · Fliesstext</p>
                </div>
                <div class="space-y-1">
                  <p class="text-base font-suse">Normaler Text — Lorem ipsum dolor sit amet consectetur.</p>
                  <p class="text-sm font-suse text-gray-500">Kleintext — Beschreibungen und Metadaten.</p>
                  <p class="text-xs font-suse text-gray-400">Labels & Hinweise — Zeitstempel, Metainfo.</p>
                </div>
              </div>

              <div class="flex items-start gap-6 pt-5">
                <div class="w-40 shrink-0">
                  <p class="text-xs text-gray-400 font-mono">SUSE Mono</p>
                  <p class="text-xs text-gray-400">Zahlen · Code</p>
                </div>
                <div class="space-y-1">
                  <p class="text-2xl font-suse-mono">1.234.567,89 €</p>
                  <p class="text-base font-suse-mono text-gray-500">+12,4 % · 0123456789</p>
                  <p class="text-sm font-suse-mono text-gray-400">CHF 9'999.00 · $1,000.00</p>
                </div>
              </div>

            </div>
          </div>
        </UCard>

        <!-- Hierarchie -->
        <UCard>
          <div class="space-y-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Hierarchie</p>
            <div class="space-y-2 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="flex items-baseline gap-6 py-2 first:pt-0">
                <span class="w-40 text-xs text-gray-400 shrink-0">h1</span>
                <h1 class="text-5xl italic font-instrument">Seitenüberschrift</h1>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">h2</span>
                <h2 class="text-[1.925rem] italic font-instrument">Abschnittstitel</h2>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">Kartentitel · text-lg</span>
                <p class="text-lg font-semibold">Kartentitel</p>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">Body · text-base</span>
                <p class="text-base">Normaler Fliesstext</p>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">Small · text-sm gray-500</span>
                <p class="text-sm text-gray-500">Sekundärer Text</p>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">Label · text-xs uppercase</span>
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Abschnittsbezeichnung</p>
              </div>
              <div class="flex items-baseline gap-6 py-2">
                <span class="w-40 text-xs text-gray-400 shrink-0">Zahl · SUSE Mono</span>
                <p class="text-base font-suse-mono">42.000,00 €</p>
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

      <!-- NEUMORPHIC CARDS -->
      <section class="space-y-4">
        <SectionTitle>Cards · Neumorphic</SectionTitle>
        <div class="flex flex-wrap gap-6">
          <div v-for="(card, idx) in neuCards" :key="idx" class="nm-base">
            <div class="nm-card">
              <div class="nm-header">
                <span class="nm-title">{{ card.label }}</span>
                <div class="nm-icon-btn">
                  <UIcon name="i-lucide-trending-up" class="w-3 h-3 text-red-400" />
                </div>
              </div>
              <div class="nm-track">
                <div class="nm-fill" :style="{ width: card.progress + '%' }" />
              </div>
              <div class="nm-progress-label">{{ card.progress }}%</div>
              <div class="nm-stats">
                <div class="nm-value-row">
                  <span class="nm-currency font-suse-mono">CHF</span>
                  <span class="nm-amount font-suse-mono">{{ card.value.toLocaleString('de-CH') }}</span>
                </div>
                <span class="nm-badge nm-badge-up">
                  <UIcon name="i-lucide-trending-up" class="w-2.5 h-2.5" />
                  +{{ card.change }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- MORPHIC ICON BUTTONS -->
      <section class="space-y-4">
        <SectionTitle>Icon Buttons · Neumorphic</SectionTitle>
        <UCard>
          <div class="flex flex-wrap items-end gap-8">
            <!-- Normal -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic">
                <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Default</span>
            </div>
            <!-- Pressed -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic btn-morphic--pressed">
                <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Pressed</span>
            </div>
            <!-- With chart icon -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic">
                <UIcon name="i-lucide-chart-candlestick" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Chart</span>
            </div>
            <!-- With gem icon -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic">
                <UIcon name="i-lucide-gem" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Gem</span>
            </div>
            <!-- Camera -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic">
                <UIcon name="i-lucide-camera" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Camera</span>
            </div>
            <!-- Pencil -->
            <div class="flex flex-col items-center gap-2">
              <button class="btn-morphic">
                <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5 text-gray-700" />
              </button>
              <span class="text-xs text-gray-400">Pencil</span>
            </div>
          </div>
        </UCard>
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
                  <p class="text-xs text-gray-400 font-suse-mono">{{ s }}</p>
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

      <!-- MODALS -->
      <section class="space-y-4">
        <UCard>
          <template #header>
            <h2 class="text-[1.925rem] italic font-instrument">Modals</h2>
          </template>
          <div class="space-y-4">
            <p class="text-sm text-gray-500">Alle Modals müssen dasselbe <code>:ui</code>-Styling verwenden. Titel immer im <code>#header</code>-Slot mit <code>font-instrument italic text-[1.6rem]</code>. Footer hat Abbrechen rechts, destruktive Aktion links.</p>
            <div class="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Standard-Template</p>
              <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap"><code>&lt;UModal
  v-model:open="isOpen"
  :ui="{
    overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
    content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
    header: 'border-b border-white/20 dark:border-white/10',
    footer: 'border-t border-white/20 dark:border-white/10',
  }"
&gt;
  &lt;template #header&gt;
    &lt;h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white"&gt;Titel&lt;/h2&gt;
    &lt;p class="text-sm text-gray-500 dark:text-gray-400"&gt;Untertitel (optional)&lt;/p&gt;
  &lt;/template&gt;
  &lt;template #body&gt;
    &lt;!-- Inhalt --&gt;
  &lt;/template&gt;
  &lt;template #footer&gt;
    &lt;div class="flex items-center justify-between w-full"&gt;
      &lt;!-- Destruktive Aktion links (optional) --&gt;
      &lt;UButton variant="ghost" color="error" icon="i-lucide-trash-2"&gt;Löschen&lt;/UButton&gt;
      &lt;div class="flex gap-2"&gt;
        &lt;UButton variant="ghost" color="neutral" @click="isOpen = false"&gt;Abbrechen&lt;/UButton&gt;
        &lt;UButton :style="{ background: '#1e3a5f' }" color="primary"&gt;Speichern&lt;/UButton&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/UModal&gt;</code></pre>
            </div>
            <UButton @click="demoModalOpen = true">Modal öffnen</UButton>
            <UModal
              v-model:open="demoModalOpen"
              :ui="{
                overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
                content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
                header: 'border-b border-white/20 dark:border-white/10',
                footer: 'border-t border-white/20 dark:border-white/10',
              }"
            >
              <template #header>
                <h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white">Beispiel Modal</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Optionaler Untertitel</p>
              </template>
              <template #body>
                <p class="text-sm text-gray-600 dark:text-gray-300">Modal-Inhalt hier.</p>
              </template>
              <template #footer>
                <div class="flex items-center justify-between w-full">
                  <UButton variant="ghost" color="error" icon="i-lucide-trash-2">Löschen</UButton>
                  <div class="flex gap-2">
                    <UButton variant="ghost" color="neutral" @click="demoModalOpen = false">Abbrechen</UButton>
                    <UButton :style="{ background: '#1e3a5f' }" color="primary" @click="demoModalOpen = false">Speichern</UButton>
                  </div>
                </div>
              </template>
            </UModal>
          </div>
        </UCard>
      </section>

      <!-- FINANCE BREAKDOWN BARS -->
      <section class="space-y-4">
        <UCard>
          <template #header>
            <h2 class="text-[1.925rem] italic font-instrument">Finance Breakdown Bars</h2>
            <p class="text-sm text-gray-500 mt-1">Horizontale Stacked-Bar-Komponente für Kategorie-Breakdowns in der Finance-View (Aktien: Währung / Typ / Sektor; Edelmetalle: Münzen/Barren / Einheit / Münzentyp). Wird im Collapsed-View der <code>FinanceBrokerStack</code>-Komponente eingesetzt.</p>
          </template>
          <div class="space-y-6">

            <!-- Live Demo -->
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Demo</p>
              <div class="rounded-xl p-4 space-y-4" style="background: #1e3a5f;">
                <!-- Bar 1: Währung -->
                <div class="breakdown-group">
                  <div class="breakdown-labels-row font-[SUSE_Mono]">
                    <span v-for="item in sgDemoBreakdown1" :key="item.label" :style="{ width: item.pct + '%', color: item.color, opacity: sgSelected1 && sgSelected1 !== item.label ? 0.35 : 1, cursor: 'pointer', transition: 'opacity 0.2s' }" @click="sgSelected1 = sgSelected1 === item.label ? null : item.label">{{ item.label }}</span>
                  </div>
                  <div class="breakdown-stacked-bar">
                    <div v-for="item in sgDemoBreakdown1" :key="item.label" class="breakdown-segment" :style="{ width: item.pct + '%', background: item.color, cursor: 'pointer', opacity: sgSelected1 && sgSelected1 !== item.label ? 0.25 : 1, filter: sgSelected1 === item.label ? 'brightness(1.35)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }" @click="sgSelected1 = sgSelected1 === item.label ? null : item.label">
                      <span class="breakdown-segment-label">{{ item.pct.toFixed(0) }}%</span>
                    </div>
                  </div>
                </div>
                <!-- Bar 2: Typ -->
                <div class="breakdown-group">
                  <div class="breakdown-labels-row font-[SUSE_Mono]">
                    <span v-for="item in sgDemoBreakdown2" :key="item.label" :style="{ width: item.pct + '%', color: item.color, opacity: sgSelected2 && sgSelected2 !== item.label ? 0.35 : 1, cursor: 'pointer', transition: 'opacity 0.2s' }" @click="sgSelected2 = sgSelected2 === item.label ? null : item.label">{{ item.label }}</span>
                  </div>
                  <div class="breakdown-stacked-bar">
                    <div v-for="item in sgDemoBreakdown2" :key="item.label" class="breakdown-segment" :style="{ width: item.pct + '%', background: item.color, cursor: 'pointer', opacity: sgSelected2 && sgSelected2 !== item.label ? 0.25 : 1, filter: sgSelected2 === item.label ? 'brightness(1.35)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }" @click="sgSelected2 = sgSelected2 === item.label ? null : item.label">
                      <span class="breakdown-segment-label">{{ item.pct.toFixed(0) }}%</span>
                    </div>
                  </div>
                </div>
                <!-- Bar 3: Kategorien mit Liste -->
                <div class="breakdown-group">
                  <div class="breakdown-labels-row font-[SUSE_Mono]">
                    <span style="color: rgba(255,255,255,0.6)">Kategorie</span>
                  </div>
                  <div class="breakdown-stacked-bar">
                    <div v-for="item in sgDemoBreakdown3" :key="item.label" class="breakdown-segment" :style="{ width: item.pct + '%', background: item.color, cursor: 'pointer', opacity: (sgHovered3 || sgSelected3) && sgHovered3 !== item.label && sgSelected3 !== item.label ? 0.25 : 1, filter: sgHovered3 === item.label || sgSelected3 === item.label ? 'brightness(1.35)' : 'none', transition: 'opacity 0.2s, filter 0.2s' }" @mouseenter="sgHovered3 = item.label" @mouseleave="sgHovered3 = null" @click="sgSelected3 = sgSelected3 === item.label ? null : item.label" />
                  </div>
                </div>
                <div class="breakdown-sector-list font-[SUSE_Mono]">
                  <div v-for="item in sgDemoBreakdown3" :key="item.label" class="breakdown-sector-row" @mouseenter="sgHovered3 = item.label" @mouseleave="sgHovered3 = null" @click="sgSelected3 = sgSelected3 === item.label ? null : item.label">
                    <span class="breakdown-sector-dot" :style="{ background: item.color, transform: sgSelected3 === item.label ? 'scale(1.5)' : 'scale(1)', transition: 'transform 0.2s' }" />
                    <span class="breakdown-sector-name" :style="{ opacity: (sgHovered3 || sgSelected3) && sgHovered3 !== item.label && sgSelected3 !== item.label ? 0.35 : 1, fontWeight: sgSelected3 === item.label ? 700 : 400 }">{{ item.label }}</span>
                    <span class="breakdown-sector-pct" :style="{ color: item.color, opacity: (sgHovered3 || sgSelected3) && sgHovered3 !== item.label && sgSelected3 !== item.label ? 0.35 : 1 }">{{ item.pct.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Regeln -->
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Regeln</p>
              <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Segment-Klick togglet Filter; nochmals klicken hebt Filter auf</li>
                <li>Aktives Segment: <code>filter: brightness(1.35)</code> — kein <code>scaleY</code> (verzerrt Text)</li>
                <li>Inaktive Segmente: <code>opacity: 0.25</code> (Bar) / <code>0.35</code> (Labels)</li>
                <li>Dritte Bar (Kategorien) mit Liste darunter: Hover bidirektional (<code>hoveredXxx</code> ref)</li>
                <li>Wrapper: <code>FinanceBrokerStack</code> mit <code>#collapsed-view</code> Slot — scrollt via <code>OverlayScrollbarsComponent</code></li>
                <li>Hintergrund immer <code>#1e3a5f</code>; Labels <code>font-[SUSE_Mono]</code></li>
              </ul>
            </div>

            <!-- CSS-Klassen -->
            <div class="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Verwendete CSS-Klassen</p>
              <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap"><code>.breakdown-group          — Wrapper pro Bar-Gruppe (labels + bar)
.breakdown-labels-row     — Flex-Row der Label-Spans (width = pct%)
.breakdown-stacked-bar    — Horizontaler Bar-Container
.breakdown-segment        — Einzelnes Segment (width = pct%, background = color)
.breakdown-segment-label  — Prozent-Text im Segment
.breakdown-sector-list    — Liste unter der dritten Bar
.breakdown-sector-row     — Zeile in der Liste (dot + name + pct)
.breakdown-sector-dot     — Farbiger Punkt
.breakdown-sector-name    — Kategoriename
.breakdown-sector-pct     — Prozentwert rechts</code></pre>
            </div>

          </div>
        </UCard>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const demoModalOpen = ref(false)

// ── Finance Breakdown Bars Demo ──
const sgSelected1 = ref<string | null>(null)
const sgSelected2 = ref<string | null>(null)
const sgSelected3 = ref<string | null>(null)
const sgHovered3 = ref<string | null>(null)
const sgDemoBreakdown1 = [
  { label: 'CHF', pct: 54, color: '#4a9eff' },
  { label: 'USD', pct: 31, color: '#a78bfa' },
  { label: 'EUR', pct: 15, color: '#34d399' },
]
const sgDemoBreakdown2 = [
  { label: 'Aktie', pct: 72, color: '#60a5fa' },
  { label: 'ETF', pct: 28, color: '#f59e0b' },
]
const sgDemoBreakdown3 = [
  { label: 'Technology', pct: 38.2, color: '#4a9eff' },
  { label: 'Healthcare', pct: 21.5, color: '#34d399' },
  { label: 'Financials', pct: 17.8, color: '#f59e0b' },
  { label: 'Energy', pct: 13.1, color: '#f87171' },
  { label: 'Industrials', pct: 9.4, color: '#a78bfa' },
]

// Inline helper components
const SectionTitle = defineComponent({
  template: `<h2 class="text-[1.925rem] italic font-instrument"><slot /></h2>`,
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

// ── Neumorphic cards ─────────────────────────────────────────────────────────

const neuCards = ref([
  { label: 'revenue',  progress: 42, value: 33678, change: '10.74' },
  { label: 'profit',   progress: 67, value: 12450, change: '5.32' },
  { label: 'orders',   progress: 88, value: 87230, change: '8.91' },
])

// Simulate live updates
onMounted(() => {
  setInterval(() => {
    neuCards.value = neuCards.value.map(c => ({
      ...c,
      value: Math.max(10000, Math.round(c.value * (1 + (Math.random() - 0.45) * 0.08))),
      change: (Math.random() * 15 + 1).toFixed(2),
    }))
  }, 4000)
})

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

<style scoped>
.nm-base {
  width: 280px;
  padding: 28px 22px;
  border-radius: 28px;
  background: #3a7bd5;
  box-shadow: 8px 8px 24px rgba(0,0,0,0.18), -4px -4px 16px rgba(255,255,255,0.08);
}

.nm-card {
  border-radius: 18px;
  padding: 20px 20px 16px;
  background: linear-gradient(145deg, #ffffff 0%, #f4f6fa 60%, #ffffff 100%);
  position: relative;
  overflow: hidden;
  box-shadow:
    -14px -14px 36px rgba(160,210,255,0.7),
    -6px -6px 14px rgba(200,230,255,0.5),
    14px 14px 36px rgba(0,0,0,0.5),
    6px 6px 14px rgba(0,0,0,0.3),
    inset 0 2px 4px rgba(255,255,255,0.95),
    inset 0 -1px 3px rgba(0,0,0,0.03);
}

.nm-card::before {
  content: '';
  position: absolute; inset: 0; border-radius: 18px;
  background: linear-gradient(160deg,
    rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%,
    rgba(255,255,255,0) 55%, rgba(255,255,255,0.08) 80%,
    rgba(255,255,255,0.3) 100%);
  pointer-events: none; z-index: 0;
}

.nm-card > * { position: relative; z-index: 2; }

.nm-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}

.nm-title {
  font-size: 14px; font-weight: 800; color: #1a1a2e; text-transform: lowercase;
  letter-spacing: 0.02em;
}

.nm-icon-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  box-shadow: 3px 3px 6px rgba(0,0,0,0.06), -2px -2px 5px rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}

.nm-track {
  height: 10px; border-radius: 10px; background: #e8ecf1;
  box-shadow: inset 3px 3px 6px #cdd1d6, inset -3px -3px 6px #ffffff;
  overflow: hidden;
}

.nm-fill {
  height: 100%; border-radius: 10px;
  background: linear-gradient(90deg, #3a7bd5, #5ea1f7);
  box-shadow: 0 2px 8px rgba(58,123,213,0.35);
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.nm-progress-label {
  text-align: right; font-size: 12px; font-weight: 700;
  color: #3a7bd5; margin-top: 5px;
}

.nm-stats {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef1f5;
}

.nm-value-row { display: flex; align-items: baseline; gap: 4px; }

.nm-currency {
  font-size: 12px; font-weight: 500; color: #6b7280;
}

.nm-amount {
  font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px;
  transition: color 0.5s ease;
}

.nm-badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 8px; border-radius: 50px;
  font-size: 11px; font-weight: 600;
  background: #eafaf0; color: #27ae60;
}

/* ── Morphic Icon Buttons ── */
.btn-morphic {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow:
    2px 2px 6px rgba(0, 0, 0, 0.13),
    -2px -2px 5px rgba(255, 255, 255, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}
.btn-morphic:hover {
  box-shadow:
    3px 3px 8px rgba(0, 0, 0, 0.16),
    -2px -2px 6px rgba(255, 255, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  transform: scale(1.05);
}
.btn-morphic:active,
.btn-morphic--pressed,
.btn-morphic--pressed:hover {
  box-shadow:
    inset 2px 2px 5px rgba(0, 0, 0, 0.18),
    inset -1px -1px 3px rgba(255, 255, 255, 0.75),
    -2px -2px 5px rgba(255, 255, 255, 0.8),
    2px 2px 6px rgba(0, 0, 0, 0.13);
  transform: scale(0.95);
}
</style>
