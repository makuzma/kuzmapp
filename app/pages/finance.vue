<template>
  <div class="finance-page p-6 min-h-screen">
    <div class="max-w-screen-2xl mx-auto space-y-10">

      <h1 class="text-5xl italic font-instrument">Finance</h1>

      <!-- Grosse rote Pill-Card -->
      <div class="pill-card">
        <div class="pill-cards-row">
          <FinanceMiniCard
            v-for="card in miniCards"
            :key="card.label"
            v-bind="card"
            :shadow="miniCardShadow"
          />
        </div>
        <div class="pill-right">
          <div class="pill-change font-suse-mono" :class="totalChange >= 0 ? 'text-green-400' : 'text-red-200'">
            {{ totalChange >= 0 ? '+' : '' }}{{ totalChange.toFixed(1) }}%
            {{ Math.abs(Math.round(totalValue * totalChange / 100)).toLocaleString('de-CH') }} CHF
          </div>
          <div class="pill-total font-suse-mono">{{ totalValue.toLocaleString('de-CH') }} CHF</div>
          <div class="pill-circle" :key="glowKey" :class="totalChange >= 0 ? 'pill-circle-up' : 'pill-circle-down'">
            <UIcon
              :name="totalChange >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
              class="pill-circle-icon"
              :class="totalChange >= 0 ? 'text-green-500' : 'text-red-700'"
            />
          </div>
        </div>
      </div>

      <!-- AKTIEN -->
      <section class="space-y-3">
        <h2 class="text-[1.925rem] italic font-instrument">Aktien</h2>
        <div class="aktien-grid">

          <!-- Spalte 1-2: Suche + Watchlist-Card (doppelt breit) -->
          <div class="placeholder-card flex flex-col gap-4 p-4">
            <div class="search-input-wrap">
              <UIcon name="i-lucide-search" class="search-icon" />
              <input class="search-input font-suse" placeholder="Aktien finden..." />
            </div>
          </div>

          <!-- Spalte 2: Gestapelte Broker-Card -->
          <div class="broker-stack">
            <div class="broker-sections-wrap">
              <div v-for="broker in brokers" :key="broker.name" class="broker-section" :style="{ background: broker.color, height: brokerStackVisible ? brokerHeight(broker.value) : '0px' }">
                <div class="broker-name">{{ broker.name }}</div>
                <div class="broker-bottom">
                  <div class="broker-change-badge font-suse-mono" :class="broker.change >= 0 ? 'badge-positive' : 'badge-negative'">
                    <UIcon name="i-lucide-triangle" class="w-2 h-2" :class="broker.change >= 0 ? '' : 'rotate-180'" />
                    {{ broker.change >= 0 ? '+' : '' }}{{ broker.change.toFixed(1) }}% {{ Math.abs(Math.round(broker.value * broker.change / 100)).toLocaleString('de-CH') }} CHF
                  </div>
                  <div class="broker-value font-suse-mono">{{ broker.value.toLocaleString('de-CH') }}</div>
                </div>
              </div>
            </div>
            <div class="broker-total font-suse-mono">
              {{ brokers.reduce((s, b) => s + b.value, 0).toLocaleString('de-CH') }}
            </div>
          </div>

          <!-- Spalte 3: Dividende + Platzhalter -->
          <div class="flex flex-col gap-4">
            <div class="dividend-card placeholder-card">
              <div class="dividend-top">
                <span class="dividend-label">Erwartete Dividende</span>
                <UIcon name="i-lucide-coins" class="dividend-icon" />
              </div>
              <div class="dividend-amount font-suse-mono">1'840</div>
              <div class="dividend-sub">
                <span class="dividend-year font-suse-mono">/ Jahr</span>
                <span class="dividend-yield font-suse-mono">3.5%</span>
              </div>
            </div>
            <div class="placeholder-card flex-1 broker-chart-card">
              <div class="broker-chart-title">Performance</div>
              <svg class="broker-line-chart" viewBox="0 0 200 100" preserveAspectRatio="none">
                <polyline
                  v-for="broker in brokers"
                  :key="broker.name"
                  :points="brokerLinePoints(broker.name)"
                  fill="none"
                  :stroke="broker.color"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="broker-chart-legend">
                <div v-for="broker in brokers" :key="broker.name" class="legend-item">
                  <span class="legend-dot" :style="{ background: broker.color }" />
                  <span class="legend-name">{{ broker.name }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- EDELMETALLE -->
      <section class="space-y-3">
        <h2 class="text-[1.925rem] italic font-instrument">Edelmetalle</h2>
        <div class="edelmetalle-grid">
          <div class="placeholder-card h-48" />
          <div class="placeholder-card h-48" />
        </div>
      </section>

      <!-- BARGELD -->
      <section class="space-y-3">
        <h2 class="text-[1.925rem] italic font-instrument">Bargeld</h2>
        <div class="placeholder-card h-32 w-full" />
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const miniCards = ref([
  { label: 'Aktien',      progress: 62, value: 53120, change: 1.2,  color: '#3b82f6' },
  { label: 'Edelmetalle', progress: 78, value: 94021, change: -1.2, color: '#f59e0b' },
  { label: 'Bargeld',     progress: 15, value: 520,   change: 0.4,  color: '#22c55e' },
  { label: 'Frankly',     progress: 40, value: 18020, change: 0,    color: '#6b7280' },
])

const pillBg = '#e8503a'
function hexToRgb(hex: string) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }
}
function neumorphicShadow(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const light = `rgba(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)},0.75)`
  const dark  = `rgba(${Math.max(0,r-80)},${Math.max(0,g-80)},${Math.max(0,b-80)},0.75)`
  return `-10px -10px 24px ${light}, 10px 10px 24px ${dark}, inset 0 2px 3px rgba(255,255,255,0.9)`
}
const miniCardShadow = neumorphicShadow(pillBg)
const totalValue = computed(() => miniCards.value.reduce((s, c) => s + c.value, 0))
const totalChange = computed(() => parseFloat((miniCards.value.reduce((s, c) => s + c.change, 0) / miniCards.value.length).toFixed(1)))
const glowKey = ref(0)

onMounted(() => {
  setInterval(() => {
    miniCards.value = miniCards.value.map(c => ({
      ...c,
      value: Math.max(100, Math.round(c.value * (1 + (Math.random() - 0.48) * 0.02))),
      change: parseFloat(((Math.random() - 0.45) * 4).toFixed(1)),
    }))
    glowKey.value++
  }, 5000)
})

const STACK_HEIGHT = 320 // px Gesamthöhe der Broker-Sektionen

function brokerHeight(value: number) {
  const total = brokers.value.reduce((s, b) => s + b.value, 0)
  return `${Math.round((value / total) * STACK_HEIGHT)}px`
}

const brokers = ref([
  { name: 'Interactive Broker', value: 17000, change: 1.2,  color: '#f0c87a' },
  { name: 'Cornertrader',       value: 27000, change: 1.2,  color: '#7ab8e0' },
  { name: 'Swissquote',         value: 46000, change: 1.2,  color: '#7acfa0' },
])

const brokerHistory: Record<string, number[]> = {
  'Interactive Broker': [14200, 14800, 15100, 14900, 15600, 16100, 15800, 16500, 17000],
  'Cornertrader':       [22000, 22800, 23500, 23100, 24200, 25000, 25800, 26500, 27000],
  'Swissquote':         [38000, 39200, 40100, 41500, 42800, 43600, 44200, 45100, 46000],
}

function brokerLinePoints(name: string): string {
  const data = brokerHistory[name]
  const allValues = Object.values(brokerHistory).flat()
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const w = 200, h = 100, pad = 8
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

const brokerStackVisible = ref(false)

onMounted(() => {
  setTimeout(() => { brokerStackVisible.value = true }, 100)
})
</script>

<style scoped>
/* ── CSS Variables ── */
:global(:root) {
  --f-bg: rgba(232, 80, 58, 0.07);
  --f-card-bg: #fdf3f1;
  --f-card-shadow: -8px -8px 18px rgba(255,255,255,0.9), 8px 8px 18px rgba(200,160,155,0.35);
  --f-text: #1a1a2e;
  --f-text-muted: rgba(26,26,46,0.5);
  --f-input-bg: #ffffff;
  --f-input-shadow: inset 4px 4px 10px rgba(200,155,150,0.2), inset -4px -4px 10px rgba(255,255,255,0.8);
  --f-input-color: #1a1a2e;
  --f-input-placeholder: #c0a09a;
  --f-search-icon: #b0908a;
  --f-broker-stack-shadow: -8px -8px 18px rgba(255,255,255,0.9), 8px 8px 18px rgba(200,160,155,0.35);
  --f-chart-bg: #ffffff;
}
:global(.dark) {
  --f-bg: #0f1923;
  --f-card-bg: #182530;
  --f-card-shadow: -4px -4px 12px rgba(255,255,255,0.04), 8px 8px 18px rgba(0,0,0,0.5);
  --f-text: #d1d5db;
  --f-text-muted: rgba(209,213,219,0.5);
  --f-input-bg: #0f1923;
  --f-input-shadow: inset 4px 4px 10px rgba(0,0,0,0.4), inset -4px -4px 10px rgba(255,255,255,0.04);
  --f-input-color: #d1d5db;
  --f-input-placeholder: rgba(209,213,219,0.35);
  --f-search-icon: rgba(209,213,219,0.4);
  --f-broker-stack-shadow: -4px -4px 12px rgba(255,255,255,0.04), 8px 8px 18px rgba(0,0,0,0.5);
  --f-chart-bg: #182530;
}

/* ── Page ── */
.finance-page { background: var(--f-bg); }

/* ── Aktien Grid ── */
.aktien-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: stretch;
}

.aktien-grid > :first-child {
  grid-column: span 2;
}

@media (max-width: 1024px) {
  .aktien-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .aktien-grid { grid-template-columns: 1fr; }
}

/* ── Broker Stack ── */
.broker-stack {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: #e8503a;
  box-shadow: var(--f-broker-stack-shadow);
}

.broker-sections-wrap {
  height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #e8503a;
  overflow: visible;
  border-top-right-radius: 16px;
}

.broker-section {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 16px;
  position: relative;
  margin-bottom: -12px;
  min-height: 80px;
  transition: height 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: visible;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.broker-section:first-child { z-index: 3; border-radius: 0 16px 16px 16px; overflow: hidden; }
.broker-section:nth-child(2) { z-index: 2; border-radius: 0 0 16px 16px; }
.broker-section:nth-child(3) { z-index: 1; border-radius: 0 0 16px 16px; }

.broker-total {
  border-radius: 0 0 16px 16px;
  z-index: 0;
}

.broker-name {
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
  opacity: 0.65;
  align-self: flex-start;
}

.broker-bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.broker-change-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}

.badge-positive {
  background: #e8503a;
  color: #c8ff57;
}

.badge-negative {
  background: #e8503a;
  color: #ff6b6b;
}

.broker-value {
  font-size: 24px;
  font-weight: 300;
  color: #1a1a2e;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.broker-total {
  background: #e8503a;
  padding: 14px;
  font-size: 18px;
  font-weight: 300;
  color: #c8ff57;
  letter-spacing: -0.5px;
  text-align: right;
  margin-top: auto;
}

/* ── Edelmetalle Grid ── */
.edelmetalle-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
}

@media (max-width: 640px) {
  .edelmetalle-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Pill Card ── */
.pill-card {
  border-radius: 28px;
  background: #e8503a;
  padding: 20px;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;
  box-shadow: 8px 8px 24px rgba(0,0,0,0.18), -4px -4px 16px rgba(255,255,255,0.06);
  position: relative;
}

.pill-cards-row {
  display: grid;
  grid-template-columns: repeat(2, 120px);
  gap: 20px;
  flex-shrink: 0;
}

@media (min-width: 900px) {
  .pill-cards-row { grid-template-columns: repeat(4, 120px); }
}

.pill-right {
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  padding-right: 84px;
  padding-top: 5px;
  gap: 4px;
  text-align: right;
}

@media (max-width: 899px) {
  .pill-right {
    padding-right: 60px;
    width: 100%;
  }
}

.pill-change { font-size: 12px; font-weight: 600; }

.pill-total {
  font-size: 36px;
  font-weight: 100;
  color: #ffffff;
  letter-spacing: -1.5px;
  line-height: 1;
}

.pill-circle {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #ffffff;
  position: absolute;
  top: 20px; right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-circle-up {
  animation: glow-up 1.2s ease-out forwards;
}

.pill-circle-down {
  animation: glow-down 1.2s ease-out forwards;
}

@keyframes glow-up {
  0%   { box-shadow: 0 0 24px 8px rgba(34,197,94,0.8), 0 0 50px 16px rgba(34,197,94,0.4); }
  100% { box-shadow: none; }
}

@keyframes glow-down {
  0%   { box-shadow: 0 0 24px 8px rgba(180,20,20,0.9), 0 0 50px 16px rgba(180,20,20,0.4); }
  100% { box-shadow: none; }
}

.pill-circle-icon {
  width: 24px;
  height: 24px;
}

@media (min-width: 1024px) {
  .pill-cards-row { grid-template-columns: repeat(4, 1fr); }
  .pill-total { font-size: 42px; }
}

/* ── Broker Chart ── */
.broker-chart-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--f-chart-bg) !important;
  box-shadow: var(--f-card-shadow) !important;
}

.broker-chart-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--f-text);
  opacity: 0.45;
}

.broker-line-chart {
  width: 100%;
  flex: 1;
}

.broker-chart-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  font-size: 10px;
  color: var(--f-text);
  opacity: 0.65;
}

/* ── Dividend Card ── */
.dividend-card {
  padding: 20px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #e8503a !important;
  box-shadow: var(--f-card-shadow) !important;
}

.dividend-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dividend-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #c8ff57;
  opacity: 0.75;
  text-transform: uppercase;
}

.dividend-icon {
  width: 16px;
  height: 16px;
  color: #c8ff57;
  opacity: 0.6;
}

.dividend-amount {
  font-size: 28px;
  font-weight: 300;
  color: #c8ff57;
  letter-spacing: -1px;
  line-height: 1;
}

.dividend-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dividend-year {
  font-size: 11px;
  color: #c8ff57;
  opacity: 0.5;
}

.dividend-yield {
  font-size: 13px;
  font-weight: 600;
  color: #c8ff57;
  background: rgba(200,255,87,0.15);
  padding: 2px 8px;
  border-radius: 20px;
}

/* ── Search Input ── */
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--f-search-icon);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  background: var(--f-input-bg);
  border: none;
  outline: none;
  border-radius: 12px;
  padding: 10px 14px 10px 36px;
  font-size: 14px;
  color: var(--f-input-color);
  box-shadow: var(--f-input-shadow);
}

.search-input::placeholder {
  color: var(--f-input-placeholder);
}

/* ── Platzhalter ── */
.placeholder-card {
  background: var(--f-card-bg);
  border-radius: 16px;
  box-shadow: var(--f-card-shadow);
}
</style>
