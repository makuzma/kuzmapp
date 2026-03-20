<template>
  <div class="p-6">
    <div class="max-w-screen-xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/stocks" class="mt-1 shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-bold">{{ symbol }}</h1>
            <span v-if="data?.currentPrice != null" class="text-2xl font-bold">
              {{ data.currentPrice.toFixed(2) }} <span class="text-sm font-normal text-gray-400">{{ data.currency }}</span>
            </span>
            <span
              v-if="data?.changePercent != null"
              class="text-sm font-medium px-2 py-0.5 rounded-full"
              :class="data.changePercent >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'"
            >
              {{ data.changePercent >= 0 ? '+' : '' }}{{ data.changePercent.toFixed(2) }}%
            </span>
          </div>
          <p v-if="data?.name && data.name !== symbol" class="text-sm text-gray-500 mt-0.5 truncate">{{ data.name }}</p>
        </div>
      </div>

      <!-- Period tabs -->
      <div class="flex items-center gap-1">
        <button
          v-for="r in ranges"
          :key="r"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="activeRange === r
            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          @click="activeRange = r"
        >{{ r }}</button>
      </div>

      <!-- Chart card -->
      <UCard>
        <!-- Loading -->
        <div v-if="pending" class="h-52 flex items-center justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-3xl" />
        </div>

        <!-- No data -->
        <div v-else-if="!history.length" class="h-52 flex items-center justify-center">
          <p class="text-sm text-gray-500">Keine Kursdaten verfügbar</p>
        </div>

        <!-- Chart -->
        <div v-else class="relative select-none" ref="chartContainer">
          <svg
            ref="svgEl"
            :viewBox="`0 0 ${VW} ${VH}`"
            width="100%"
            class="overflow-visible"
            @mousemove="onMouseMove"
            @mouseleave="tooltip = null"
          >
            <defs>
              <linearGradient :id="`grad-${symbol}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="chartColor" stop-opacity="0.2" />
                <stop offset="100%" :stop-color="chartColor" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Area fill -->
            <polygon
              v-if="areaPoints"
              :points="areaPoints"
              :fill="`url(#grad-${symbol})`"
            />

            <!-- Line -->
            <polyline
              v-if="linePoints"
              :points="linePoints"
              fill="none"
              :stroke="chartColor"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <!-- Single dot (when only 1 point) -->
            <circle
              v-if="history.length === 1"
              :cx="ptX(0)"
              :cy="ptY(history[0].close)"
              r="4"
              :fill="chartColor"
            />

            <!-- Hover crosshair -->
            <line
              v-if="tooltip"
              :x1="tooltip.svgX" :y1="PAD.top"
              :x2="tooltip.svgX" :y2="VH - PAD.bottom"
              stroke="#9ca3af"
              stroke-width="1"
              stroke-dasharray="3,3"
            />

            <!-- Hover dot -->
            <circle
              v-if="tooltip"
              :cx="tooltip.svgX"
              :cy="tooltip.svgY"
              r="4"
              :fill="chartColor"
              stroke="white"
              stroke-width="2"
            />
          </svg>

          <!-- Tooltip HTML overlay -->
          <div
            v-if="tooltip"
            class="absolute pointer-events-none z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-xs shadow-sm"
            :style="tooltipStyle"
          >
            <p class="font-semibold">{{ tooltip.close.toFixed(2) }} {{ data?.currency }}</p>
            <p class="text-gray-500">{{ formatDate(tooltip.time) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Position card -->
      <UCard v-if="position?.shares && position?.purchasePrice && data?.currentPrice != null">
        <template #header>
          <h2 class="font-semibold">Meine Position</h2>
        </template>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p class="text-xs text-gray-500 mb-1">Stück</p>
            <p class="font-bold">{{ position.shares }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p class="text-xs text-gray-500 mb-1">Kaufpreis Ø</p>
            <p class="font-bold">{{ position.purchasePrice.toFixed(2) }} {{ data.currency }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p class="text-xs text-gray-500 mb-1">Investiert</p>
            <p class="font-bold">{{ fmt(position.shares * position.purchasePrice) }} {{ data.currency }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p class="text-xs text-gray-500 mb-1">Aktueller Wert</p>
            <p class="font-bold">{{ fmt(position.shares * data.currentPrice) }} {{ data.currency }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:col-span-2">
            <p class="text-xs text-gray-500 mb-1">Gewinn / Verlust</p>
            <p class="font-bold" :class="positionPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
              {{ positionPnl >= 0 ? '+' : '' }}{{ fmt(positionPnl) }} {{ data.currency }}
              <span class="text-sm font-normal">({{ positionPnlPct >= 0 ? '+' : '' }}{{ positionPnlPct.toFixed(2) }}%)</span>
            </p>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const headers = useRequestHeaders(['cookie'])
const route = useRoute()
const symbol = route.params.symbol as string

const ranges = ['1W', '1M', '3M', '1J', '5J']
const activeRange = ref('1M')

const { data, pending } = await useFetch(
  () => `/api/stocks/history/${encodeURIComponent(symbol)}?range=${activeRange.value}`,
  { headers, watch: [activeRange] }
)

interface WatchlistGroup {
  symbol: string
  totalShares: number | null
  avgPurchasePrice: number | null
  tranches: { id: string; shares: number | null; purchasePrice: number | null }[]
}

const { data: watchlistData } = await useFetch<WatchlistGroup[]>(
  '/api/stocks/watchlist',
  { headers }
)
const position = computed(() => {
  const group = watchlistData.value?.find(g => g.symbol === symbol)
  if (!group) return null
  return { shares: group.totalShares, purchasePrice: group.avgPurchasePrice }
})

const history = computed(() => (data.value as any)?.history ?? [])

// --- Chart constants ---
const VW = 600
const VH = 200
const PAD = { top: 16, right: 10, bottom: 10, left: 10 }
const PLOT_W = VW - PAD.left - PAD.right
const PLOT_H = VH - PAD.top - PAD.bottom

const chartBounds = computed(() => {
  const h = history.value
  if (!h.length) return { min: 0, max: 1 }
  const prices = h.map((d: any) => d.close)
  let min = Math.min(...prices)
  let max = Math.max(...prices)
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.05
  return { min: min - pad, max: max + pad }
})

function ptX(i: number) {
  const n = history.value.length
  if (n <= 1) return PAD.left + PLOT_W / 2
  return PAD.left + (i / (n - 1)) * PLOT_W
}

function ptY(close: number) {
  const { min, max } = chartBounds.value
  return PAD.top + (1 - (close - min) / (max - min)) * PLOT_H
}

const chartColor = computed(() => {
  const h = history.value
  if (h.length < 2) return '#6b7280'
  return h[h.length - 1].close >= h[0].close ? '#22c55e' : '#ef4444'
})

const linePoints = computed(() => {
  const h = history.value
  if (h.length < 2) return ''
  return h.map((d: any, i: number) => `${ptX(i)},${ptY(d.close)}`).join(' ')
})

const areaPoints = computed(() => {
  const h = history.value
  if (h.length < 2) return ''
  const line = h.map((d: any, i: number) => `${ptX(i)},${ptY(d.close)}`)
  const bottomY = PAD.top + PLOT_H
  return [...line, `${ptX(h.length - 1)},${bottomY}`, `${ptX(0)},${bottomY}`].join(' ')
})

// --- Tooltip ---
const svgEl = ref<SVGSVGElement | null>(null)
const chartContainer = ref<HTMLDivElement | null>(null)

const tooltip = ref<{ svgX: number; svgY: number; close: number; time: string; screenXFrac: number; screenYFrac: number } | null>(null)

function onMouseMove(event: MouseEvent) {
  const h = history.value
  if (h.length < 2 || !svgEl.value) return

  const rect = svgEl.value.getBoundingClientRect()
  const frac = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const idx = Math.round(frac * (h.length - 1))
  const point = h[idx]

  tooltip.value = {
    svgX: ptX(idx),
    svgY: ptY(point.close),
    close: point.close,
    time: point.time,
    screenXFrac: ptX(idx) / VW,
    screenYFrac: ptY(point.close) / VH,
  }
}

const tooltipStyle = computed(() => {
  if (!tooltip.value || !svgEl.value) return {}
  const rect = svgEl.value.getBoundingClientRect()
  const left = tooltip.value.screenXFrac * rect.width
  const top = tooltip.value.screenYFrac * rect.height
  // Clamp horizontal so tooltip doesn't overflow
  const clampedLeft = Math.max(40, Math.min(rect.width - 40, left))
  return {
    left: `${clampedLeft}px`,
    top: `${top}px`,
    transform: 'translate(-50%, -110%)',
  }
})

// --- Helpers ---
function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function fmt(val: number) {
  return val.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// --- Position P&L ---
const positionPnl = computed(() => {
  if (!position.value?.shares || !position.value?.purchasePrice || !data.value) return 0
  return (data.value as any).currentPrice * position.value.shares - position.value.purchasePrice * position.value.shares
})
const positionPnlPct = computed(() => {
  if (!position.value?.purchasePrice) return 0
  return (positionPnl.value / (position.value.purchasePrice * position.value.shares!)) * 100
})
</script>
