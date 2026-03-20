<template>
  <div class="p-6">
    <div class="max-w-[1600px] mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
          <div>
            <h1 class="text-2xl font-bold">Vermögensübersicht</h1>
            <p class="text-sm text-gray-500 mt-0.5">Aktien · Edelmetalle · Cash · Säule 3A</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Gesamtvermögen</p>
          <p class="text-3xl font-bold">{{ fmt(totalWealth) }}</p>
          <p class="text-sm text-gray-400 font-medium">CHF</p>
        </div>
      </div>

      <!-- Aktien Portfolio Widget -->
      <div v-if="portfolioSummaryCards.length">
        <h2 class="text-6xl italic mb-3 text-gray-700 dark:text-gray-300" style="font-family: 'Instrument Serif', serif;">Aktien Portfolio</h2>
        <div class="flex items-end gap-4">
          <div class="flex gap-3 flex-1 flex-wrap">
            <div
              v-for="card in portfolioSummaryCards"
              :key="card.portfolio.id"
              class="flex-1 min-w-[140px] rounded-2xl px-5 py-4 bg-white dark:bg-gray-900"
              :style="{ border: `2px solid ${colorHex(card.portfolio.color)}` }"
            >
              <!-- Prozent + CHF + Pfeil -->
              <div class="flex items-center gap-1.5 text-xs font-semibold mb-3"
                   :class="card.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                <span>{{ card.pnl >= 0 ? '+' : '' }}{{ card.pnlPct.toFixed(1) }}%</span>
                <span>{{ fmt(Math.abs(card.pnl)) }} CHF</span>
                <span class="text-base leading-none">{{ card.pnl >= 0 ? '▲' : '▼' }}</span>
              </div>
              <!-- Grosser Marktwert -->
              <p class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {{ Math.round(card.value).toLocaleString('de-CH') }}
              </p>
            </div>
          </div>
          <!-- Gesamtsumme -->
          <div class="text-right shrink-0 pb-1">
            <p class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {{ Math.round(totalStocksValue).toLocaleString('de-CH') }}
            </p>
            <span class="text-green-500 text-base">▲</span>
          </div>
        </div>
      </div>

      <!-- Edelmetalle -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-gem" class="text-yellow-500" />
              <h2 class="font-semibold">Edelmetalle Spot</h2>
            </div>
            <div class="flex items-center gap-2">
              <USelect v-model="metalCurrency" :items="currencyOptions" size="sm" class="w-28" />
              <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="metalsPending" @click="refreshMetals()" />
            </div>
          </div>
        </template>

        <div v-if="metalsPending && !metals.length" class="py-6 flex justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="m in metals" :key="m.key" class="space-y-1">
            <p class="text-xs text-gray-500 flex items-center gap-1">
              <span>{{ metalIcon(m.key) }}</span>
              {{ m.name }}
            </p>
            <p class="text-base font-bold">{{ fmtMetal(m.pricePerOz) }} <span class="text-xs font-normal text-gray-400">/ oz</span></p>
            <p class="text-sm text-gray-500">{{ fmtMetal(m.pricePerGram) }} <span class="text-xs text-gray-400">/ g</span></p>
            <p class="text-xs font-medium" :class="m.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
              {{ m.changePercent >= 0 ? '+' : '' }}{{ m.changePercent.toFixed(2) }}%
            </p>
          </div>
        </div>
      </UCard>

      <!-- gold.ch Händlerpreise -->
      <UCard>
        <template #header>
          <button class="w-full flex items-center justify-between" @click="goldchOpen = !goldchOpen">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shopping-cart" class="text-yellow-600" />
              <div class="text-left">
                <h2 class="font-semibold">Händlerpreise</h2>
                <p class="text-xs text-gray-400">Quelle: gold.ch · alle 5 Min. aktualisiert</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton v-if="goldchOpen" variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="goldchPending" @click.stop="refreshGoldch()" />
              <UIcon :name="goldchOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400" />
            </div>
          </button>
        </template>

        <div v-if="goldchOpen">
        <div v-if="goldchPending && !goldchPrices.length" class="py-6 flex justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
        </div>

        <div v-else class="space-y-4">
          <div v-for="section in goldchSections" :key="section.name">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{{ section.name }}</p>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="item in section.items"
                :key="item.label"
                class="py-2 flex items-center justify-between gap-4"
              >
                <span class="text-sm">{{ item.label }}</span>
                <div class="flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <p class="text-sm font-medium">{{ item.cheapest.toLocaleString('de-CH', { minimumFractionDigits: 2 }) }} <span class="text-xs text-gray-400">CHF</span></p>
                    <p class="text-xs" :class="item.cheapestChange.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-500'">Kauf {{ item.cheapestChange }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">{{ item.expensive.toLocaleString('de-CH', { minimumFractionDigits: 2 }) }} <span class="text-xs text-gray-400">CHF</span></p>
                    <p class="text-xs" :class="item.expensiveChange.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-500'">Ankauf {{ item.expensiveChange }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </UCard>

      <!-- Edelmetall-Portfolio -->
      <UCard :ui="!edelmetalleOpen ? { body: 'p-0' } : {}">
        <template #header>
          <button class="w-full flex items-center justify-between" @click="edelmetalleOpen = !edelmetalleOpen">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-package" class="text-yellow-600" />
              <h2 class="font-semibold">Meine Edelmetalle</h2>
              <span v-if="filteredHoldings.length" class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{{ filteredHoldings.length }}</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="!edelmetalleOpen && holdingTotalValue > 0">
                <div class="hidden sm:flex items-center gap-4 text-sm">
                  <div class="text-right">
                    <p class="text-xs text-gray-400">Investiert</p>
                    <p class="font-semibold">{{ fmtMetal(holdingTotalInvested) }} <span class="text-xs font-normal text-gray-400">{{ holdingCurrency }}</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400">Aktuell</p>
                    <p class="font-semibold">{{ fmtMetal(holdingTotalValue) }} <span class="text-xs font-normal text-gray-400">{{ holdingCurrency }}</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400">G/V</p>
                    <p class="font-semibold" :class="holdingTotalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ holdingTotalPnl >= 0 ? '+' : '' }}{{ fmtMetal(holdingTotalPnl) }}
                      <span class="text-xs font-normal">({{ holdingTotalPnl >= 0 ? '+' : '' }}{{ holdingTotalPnlPct.toFixed(2) }}%)</span>
                    </p>
                  </div>
                </div>
              </template>
              <div class="flex items-center gap-1 shrink-0">
                <USelect v-model="holdingCurrency" :items="currencyOptions" size="sm" class="w-28" @click.stop />
                <UButton icon="i-lucide-plus" size="sm" @click.stop="addHoldingOpen = true">Hinzufügen</UButton>
                <UIcon :name="edelmetalleOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400" />
              </div>
            </div>
          </button>
        </template>

        <div v-if="edelmetalleOpen">
          <div v-if="holdingsPending && !filteredHoldings.length" class="py-6 flex justify-center">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
          </div>

          <p v-else-if="!filteredHoldings.length" class="text-sm text-gray-500 py-4 text-center">
            {{ activePortfolioId ? 'Keine Edelmetalle in diesem Portfolio.' : 'Noch keine Edelmetalle erfasst.' }}
          </p>

          <template v-else-if="filteredHoldings.length">
            <!-- Metal groups (each collapsed by default) -->
            <div class="space-y-2">
              <div v-for="metalGroup in holdingsByMetal" :key="metalGroup.metalKey" class="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <!-- Metal group header -->
                <button class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors" @click="toggleMetalGroup(metalGroup.metalKey)">
                  <span class="text-xl shrink-0">{{ metalIcon(metalGroup.metalKey) }}</span>
                  <span class="font-semibold text-sm">{{ metalName(metalGroup.metalKey) }}</span>
                  <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full px-2 py-0.5 font-medium">{{ metalGroup.items.length }}</span>
                  <div class="flex-1" />
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">{{ fmtMetal(metalGroup.totalValue) }} {{ holdingCurrency }}</span>
                  <UIcon :name="openMetalGroups.has(metalGroup.metalKey) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400 shrink-0" />
                </button>

                <!-- Metal group content -->
                <div v-if="openMetalGroups.has(metalGroup.metalKey)" class="border-t border-gray-100 dark:border-gray-800">
                  <!-- Column headers -->
                  <div class="hidden sm:flex items-center gap-4 px-4 pt-2 pb-1">
                    <div class="flex-1 min-w-0 text-xs font-medium text-gray-400">Art / Menge</div>
                    <div class="w-24 text-right shrink-0 text-xs font-medium text-gray-400">Kaufdatum</div>
                    <div class="w-32 shrink-0 text-right text-xs font-medium text-gray-400">Kaufpreis</div>
                    <div class="w-28 text-right shrink-0 text-xs font-medium text-gray-400">Aktueller Wert</div>
                    <div class="w-16 shrink-0" />
                  </div>

                  <div class="space-y-2 px-2 pb-2">
                    <template v-for="group in metalGroup.coinGroups" :key="group.key">
                      <!-- Single item -->
                      <div v-if="group.items.length === 1" class="py-3 flex items-center gap-4">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                          <span class="text-xl shrink-0">{{ metalIcon(group.items[0].metalKey) }}</span>
                          <div class="min-w-0">
                            <p class="font-medium text-sm">
                              <span v-if="group.items[0].coinType" class="text-gray-700 dark:text-gray-300">{{ group.items[0].coinType }}</span>
                              <span v-else class="text-gray-500">—</span>
                            </p>
                            <p class="text-xs text-gray-500">{{ group.items[0].quantity }} {{ group.items[0].unit }}</p>
                            <div v-if="group.items[0].goldch" class="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                              <span>gold.ch:</span>
                              <span>Kauf <span class="font-medium text-gray-600 dark:text-gray-300">{{ fmtMetal(group.items[0].goldch.kaufpreis) }} CHF</span></span>
                              <span>Ankauf <span class="font-medium text-gray-600 dark:text-gray-300">{{ fmtMetal(group.items[0].goldch.ankauf) }} CHF</span></span>
                            </div>
                          </div>
                        </div>
                        <div class="w-24 text-right shrink-0">
                          <p class="text-sm text-gray-500">{{ group.items[0].purchaseDate ?? '—' }}</p>
                        </div>
                        <div class="w-32 shrink-0 text-right">
                          <div v-if="group.items[0].purchasePricePerOz != null" class="inline-block border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ fmtMetal(priceFromPerOz(group.items[0].purchasePricePerOz, group.items[0].unit)) }} {{ group.items[0].purchaseCurrency }}<span class="text-xs font-normal text-gray-400">/{{ group.items[0].unit }}</span></p>
                          </div>
                        </div>
                        <div class="w-28 text-right shrink-0">
                          <p class="font-semibold text-sm">{{ group.items[0].currentTotal != null ? fmtMetal(group.items[0].currentTotal) : '—' }} {{ holdingCurrency }}</p>
                          <p v-if="group.items[0].pnl != null" class="text-xs" :class="group.items[0].pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                            {{ group.items[0].pnl >= 0 ? '+' : '' }}{{ fmtMetal(group.items[0].pnl) }} ({{ group.items[0].pnlPct?.toFixed(2) }}%)
                          </p>
                        </div>
                        <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                          <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEditHolding(group.items[0])" />
                          <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingHoldingId === group.items[0].id" @click="removeHolding(group.items[0].id)" />
                        </div>
                      </div>

                      <!-- Multiple items: grouped card -->
                      <div v-else class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div class="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                          <span class="font-semibold text-sm">{{ group.coinType || metalName(group.metalKey) }}</span>
                          <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 font-medium">{{ group.items.length }}×</span>
                          <div class="flex-1" />
                          <span class="text-sm font-bold">{{ fmtMetal(group.items.reduce((s: number, h: any) => s + (h.currentTotal ?? 0), 0)) }} {{ holdingCurrency }}</span>
                        </div>
                        <div class="divide-y divide-gray-100 dark:divide-gray-800">
                          <div v-for="h in group.items" :key="h.id" class="py-2.5 px-4 flex items-center gap-4">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                              <div class="w-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                              <div class="min-w-0">
                                <p class="text-sm text-gray-700 dark:text-gray-300">{{ h.quantity }} {{ h.unit }}</p>
                              </div>
                            </div>
                            <div class="w-24 text-right shrink-0"><p class="text-sm text-gray-500">{{ h.purchaseDate ?? '—' }}</p></div>
                            <div class="w-32 shrink-0 text-right">
                              <div v-if="h.purchasePricePerOz != null" class="inline-block border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ fmtMetal(priceFromPerOz(h.purchasePricePerOz, h.unit)) }} {{ h.purchaseCurrency }}<span class="text-xs font-normal text-gray-400">/{{ h.unit }}</span></p>
                              </div>
                            </div>
                            <div class="w-28 text-right shrink-0">
                              <p class="font-semibold text-sm">{{ h.currentTotal != null ? fmtMetal(h.currentTotal) : '—' }} {{ holdingCurrency }}</p>
                              <p v-if="h.pnl != null" class="text-xs" :class="h.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                                {{ h.pnl >= 0 ? '+' : '' }}{{ fmtMetal(h.pnl) }} ({{ h.pnlPct?.toFixed(2) }}%)
                              </p>
                            </div>
                            <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                              <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEditHolding(h)" />
                              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingHoldingId === h.id" @click="removeHolding(h.id)" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="flex items-center gap-6 mt-4 mb-1 px-1">
              <p class="text-xs font-medium text-gray-400 flex-1">Original Kaufpreis</p>
              <p class="text-xs font-medium text-gray-400 flex-1">Aktueller Wert</p>
              <p class="text-xs font-medium text-gray-400 flex-1">Gewinn / Verlust</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p class="font-bold">{{ fmtMetal(holdingTotalInvested) }} {{ holdingCurrency }}</p>
              </div>
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p class="font-bold">{{ fmtMetal(holdingTotalValue) }} {{ holdingCurrency }}</p>
              </div>
              <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p class="font-bold" :class="holdingTotalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                  {{ holdingTotalPnl >= 0 ? '+' : '' }}{{ fmtMetal(holdingTotalPnl) }}
                  <span v-if="holdingTotalInvested > 0" class="text-sm font-normal">({{ holdingTotalPnl >= 0 ? '+' : '' }}{{ holdingTotalPnlPct.toFixed(2) }}%)</span>
                </p>
              </div>
            </div>

            <!-- Metal breakdown -->
            <USeparator class="my-4" />
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-medium text-gray-400">Bestand</p>
              <div class="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                <button v-for="u in ['oz', 'g', 'kg']" :key="u" class="px-2.5 py-1 transition-colors" :class="summaryUnit === u ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'" @click="summaryUnit = u">{{ u }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="m in holdingMetalSummary"
                :key="m.metalKey"
                type="button"
                class="rounded-lg p-3 flex items-center gap-3 transition-all text-left border-2"
                :class="activeMetalFilter === m.metalKey ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'"
                @click="activeMetalFilter = activeMetalFilter === m.metalKey ? null : m.metalKey"
              >
                <span class="text-2xl shrink-0">{{ metalIcon(m.metalKey) }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-medium" :class="activeMetalFilter === m.metalKey ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'">{{ metalName(m.metalKey) }}</p>
                    <span class="text-xs font-semibold" :class="activeMetalFilter === m.metalKey ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">{{ m.pct.toFixed(1) }}%</span>
                  </div>
                  <p class="font-bold text-sm">{{ fmtSummaryQty(m.totalOz) }} {{ summaryUnit }}</p>
                  <p class="text-xs text-gray-400">{{ m.types }} {{ m.types === 1 ? 'Typ' : 'Typen' }} · {{ m.entries }} {{ m.entries === 1 ? 'Eintrag' : 'Einträge' }}</p>
                </div>
              </button>
            </div>
          </template>
        </div>
      </UCard>

      <!-- Search card -->
      <UCard>
        <UInput
          v-model="searchQuery"
          placeholder="Ticker oder Name suchen (z.B. NESN, Apple, Novartis)"
          icon="i-lucide-search"
          @input="onSearchInput"
        />
        <div v-if="searchResults.length" class="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="result in searchResults"
            :key="result.symbol"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium shrink-0">{{ result.symbol }}</span>
              <span class="text-sm text-gray-500 truncate">{{ result.name }}</span>
              <UBadge variant="subtle" color="neutral" class="shrink-0">{{ result.exchange }}</UBadge>
              <UBadge v-if="result.type === 'ETF'" variant="subtle" color="blue" class="shrink-0">ETF</UBadge>
            </div>
            <UButton
              size="sm"
              icon="i-lucide-plus"
              :color="isInWatchlist(result.symbol) ? 'neutral' : 'primary'"
              :variant="isInWatchlist(result.symbol) ? 'outline' : 'solid'"
              :loading="addingSymbol === result.symbol"
              class="ml-3 shrink-0"
              @click="addToWatchlist(result)"
            >
              {{ isInWatchlist(result.symbol) ? 'Tranche hinzufügen' : 'Hinzufügen' }}
            </UButton>
          </div>
        </div>
        <p v-else-if="searchQuery && !searchLoading" class="mt-3 text-sm text-gray-500">
          Keine Ergebnisse für „{{ searchQuery }}"
        </p>
      </UCard>

      <!-- Portfolio summary -->
      <div v-if="portfolioItems.length || totalCashChf > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <UCard>
          <p class="text-xs text-gray-500 mb-1">Investiert <span class="text-gray-400">CHF</span></p>
          <p class="text-lg font-bold">{{ fmt(totalInvested) }}</p>
        </UCard>
        <UCard>
          <p class="text-xs text-gray-500 mb-1">Aktueller Wert <span class="text-gray-400">CHF</span></p>
          <p class="text-lg font-bold">{{ fmt(totalValue) }}</p>
          <p v-if="totalCashChf > 0" class="text-xs text-gray-400 mt-0.5">inkl. {{ fmt(totalCashChf) }} Cash</p>
        </UCard>
        <UCard>
          <p class="text-xs text-gray-500 mb-1">Gewinn / Verlust <span class="text-gray-400">CHF</span></p>
          <p class="text-lg font-bold" :class="totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
            {{ totalPnl >= 0 ? '+' : '' }}{{ fmt(totalPnl) }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-gray-500 mb-1">Rendite</p>
          <p class="text-lg font-bold" :class="totalPnlPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
            {{ totalPnlPct >= 0 ? '+' : '' }}{{ totalPnlPct.toFixed(2) }}%
          </p>
        </UCard>
      </div>

      <!-- Watchlist Portfolio-Filter -->
      <div v-if="aktienportfolios.length > 0" class="flex items-center gap-2 flex-wrap">
        <button
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="activePortfolioId === null ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          @click="activePortfolioId = null; sortByPortfolio = true"
        >
          Alle
        </button>
        <button
          v-for="p in aktienportfolios"
          :key="p.id"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
          :class="activePortfolioId === p.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          :style="activePortfolioId === p.id ? { backgroundColor: colorHex(p.color) } : {}"
          @click="activePortfolioId = p.id; sortByPortfolio = false"
        >
          <UIcon name="i-lucide-folder" class="text-xs shrink-0" :style="activePortfolioId !== p.id ? { color: colorHex(p.color) } : {}" />
          {{ p.name }}
        </button>
      </div>

      <!-- Watchlist table -->
      <UCard :ui="watchlistOpen ? { root: 'rounded-b-none' } : { root: 'rounded-b-none', body: 'p-0' }">
        <template #header>
          <button class="w-full flex items-center justify-between gap-4" @click="watchlistOpen = !watchlistOpen">
            <div class="flex items-center gap-2">
              <h2 class="font-semibold">Meine Aktien</h2>
              <span v-if="filteredWatchlist.length" class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{{ filteredWatchlist.length }}</span>
            </div>
            <div class="flex items-center gap-4">
              <!-- Summary stats when collapsed -->
              <template v-if="!watchlistOpen && portfolioItems.length">
                <div class="hidden sm:flex items-center gap-4 text-sm">
                  <div class="text-right">
                    <p class="text-xs text-gray-400">Investiert</p>
                    <p class="font-semibold">{{ fmt(totalInvested) }} <span class="text-xs font-normal text-gray-400">CHF</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400">Aktuell</p>
                    <p class="font-semibold">{{ fmt(totalStocksValue) }} <span class="text-xs font-normal text-gray-400">CHF</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400">G/V</p>
                    <p class="font-semibold" :class="totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ totalPnl >= 0 ? '+' : '' }}{{ fmt(totalPnl) }}
                      <span class="text-xs font-normal">({{ totalPnlPct >= 0 ? '+' : '' }}{{ totalPnlPct.toFixed(2) }}%)</span>
                    </p>
                  </div>
                </div>
              </template>
              <div class="flex items-center gap-1 shrink-0">
                <UButton variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="watchlistPending" @click.stop="refresh()" />
                <UIcon :name="watchlistOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400" />
              </div>
            </div>
          </button>
        </template>

        <div v-if="watchlistOpen">
        <div v-if="watchlistPending && !watchlist.length" class="py-8 flex justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
        </div>

        <p v-else-if="!filteredWatchlist.length" class="text-sm text-gray-500 py-6 text-center">
          {{ activePortfolioId ? 'Keine Aktien in diesem Portfolio. Suche oben nach einer Aktie.' : 'Noch keine Aktien in deiner Watchlist. Suche oben nach einer Aktie.' }}
        </p>

        <template v-else>

          <!-- "Alle"-Modus: Portfolio-Sektionen eingeklappt -->
          <template v-if="!activePortfolioId">
            <div v-for="section in watchlistByPortfolio" :key="section.key" class="border-b last:border-b-0 border-gray-100 dark:border-gray-800">
              <!-- Sektion-Header -->
              <button class="w-full flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg transition-colors" @click="togglePortfolioSection(section.key)">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: section.portfolio ? colorHex(section.portfolio.color) : '#9ca3af' }" />
                  <span class="font-semibold text-sm">{{ section.portfolio?.name ?? 'Ohne Portfolio' }}</span>
                  <span class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{{ section.groups.length }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <template v-if="!openPortfolioSections.has(section.key) && section.stats.value > 0">
                    <div class="hidden sm:flex items-center gap-4 text-sm">
                      <div class="text-right">
                        <p class="text-xs text-gray-400">Investiert</p>
                        <p class="font-semibold">{{ fmt(section.stats.invested) }} <span class="text-xs font-normal text-gray-400">CHF</span></p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-gray-400">Aktuell</p>
                        <p class="font-semibold">{{ fmt(section.stats.value) }} <span class="text-xs font-normal text-gray-400">CHF</span></p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-gray-400">G/V</p>
                        <p class="font-semibold" :class="section.stats.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                          {{ section.stats.pnl >= 0 ? '+' : '' }}{{ fmt(section.stats.pnl) }}
                          <span class="text-xs font-normal">({{ section.stats.pnlPct >= 0 ? '+' : '' }}{{ section.stats.pnlPct.toFixed(2) }}%)</span>
                        </p>
                      </div>
                    </div>
                  </template>
                  <UIcon :name="openPortfolioSections.has(section.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400 shrink-0" />
                </div>
              </button>
              <!-- Sektion-Inhalt -->
              <div v-if="openPortfolioSections.has(section.key)" class="pt-1 pb-3">
                <div class="hidden sm:flex items-center gap-2 px-1 mb-1 text-xs font-medium text-gray-400">
                  <div class="flex-1 min-w-0">Symbol / Name</div>
                  <div class="w-28 text-right shrink-0">Kurs</div>
                  <div class="w-14 text-right shrink-0">Tag G/V</div>
                  <div class="w-16 text-right shrink-0">Stück</div>
                  <div class="w-24 text-right shrink-0">Marktwert</div>
                  <div class="w-28 text-right shrink-0">Gewinn / Verlust</div>
                  <div class="w-16 shrink-0" />
                </div>
                <div class="space-y-2">
                  <template v-for="group in section.groups" :key="group.symbol">
                    <div v-if="group.tranches.length === 1" class="py-3 flex items-center gap-2">
                      <div class="flex-1 min-w-0">
                        <span class="font-medium cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline text-sm" @click="navigateTo(`/stocks/${group.symbol}`)">{{ group.symbol }}</span>
                        <p class="text-xs text-gray-400 truncate">{{ group.name }}</p>
                      </div>
                      <div class="w-28 text-right shrink-0">
                        <span v-if="group.price != null" :class="(group.changePercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">{{ group.price.toFixed(2) }} <span class="text-xs text-gray-400">{{ group.currency }}</span></span>
                        <p v-if="group.changePercent != null" class="text-xs" :class="group.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ group.changePercent >= 0 ? '+' : '' }}{{ group.changePercent.toFixed(2) }}%</p>
                      </div>
                      <div class="w-14 text-right shrink-0">
                        <span v-if="group.totalShares && group.changePercent != null && group.price != null" class="text-sm font-medium" :class="groupTagPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ groupTagPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupTagPnl(group)) }}</span>
                        <span v-else class="text-gray-400 text-sm">—</span>
                      </div>
                      <div class="w-16 text-right shrink-0">
                        <span v-if="group.totalShares" class="text-sm">{{ group.totalShares }} Stk.</span>
                        <span v-else class="text-gray-400 text-sm">—</span>
                      </div>
                      <div class="w-24 text-right shrink-0">
                        <span v-if="group.totalShares && group.price != null" class="font-semibold text-sm">{{ fmt(group.totalShares * group.price) }} <span class="text-xs font-normal text-gray-400">{{ group.currency }}</span></span>
                        <span v-else class="text-gray-400 text-sm">—</span>
                      </div>
                      <div class="w-28 text-right shrink-0">
                        <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                          <p :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">{{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }}</p>
                          <p class="text-xs" :class="groupPnlPct(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ groupPnlPct(group) >= 0 ? '+' : '' }}{{ groupPnlPct(group).toFixed(2) }}%</p>
                        </template>
                        <span v-else class="text-gray-400 text-sm">—</span>
                      </div>
                      <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                        <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEdit(group, group.tranches[0])" />
                        <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingId === group.tranches[0].id" @click="removeFromWatchlist(group.tranches[0].id)" />
                      </div>
                    </div>
                    <div v-else class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                        <div class="flex-1 min-w-0 flex items-center gap-2">
                          <span class="font-semibold text-sm cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline" @click="navigateTo(`/stocks/${group.symbol}`)">{{ group.symbol }}</span>
                          <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full px-2 py-0.5 font-medium">{{ group.tranches.length }}×</span>
                          <span class="text-xs text-gray-400 hidden sm:inline truncate">{{ group.name }}</span>
                        </div>
                        <div class="w-28 text-right shrink-0">
                          <span v-if="group.price != null" :class="(group.changePercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">{{ group.price.toFixed(2) }} <span class="text-xs text-gray-400">{{ group.currency }}</span></span>
                          <p v-if="group.changePercent != null" class="text-xs" :class="group.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ group.changePercent >= 0 ? '+' : '' }}{{ group.changePercent.toFixed(2) }}%</p>
                        </div>
                        <div class="w-14 text-right shrink-0">
                          <span v-if="group.totalShares && group.changePercent != null && group.price != null" class="text-sm font-medium" :class="groupTagPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ groupTagPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupTagPnl(group)) }}</span>
                        </div>
                        <div class="w-16 text-right shrink-0"><span v-if="group.totalShares" class="font-semibold text-sm">{{ group.totalShares }} Stk.</span></div>
                        <div class="w-24 text-right shrink-0"><span v-if="group.totalShares && group.price != null" class="font-bold text-sm">{{ fmt(group.totalShares * group.price) }}</span></div>
                        <div class="w-28 text-right shrink-0">
                          <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                            <p :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-bold text-sm">{{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }}</p>
                            <p class="text-xs text-gray-400">Ø {{ group.avgPurchasePrice.toFixed(2) }}</p>
                          </template>
                        </div>
                        <div class="w-16 shrink-0" />
                      </div>
                      <div class="divide-y divide-gray-100 dark:divide-gray-800">
                        <div v-for="tranche in group.tranches" :key="tranche.id" class="py-2.5 px-4 flex items-center gap-2">
                          <div class="flex-1 min-w-0 flex items-center gap-3">
                            <div class="w-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                            <div class="min-w-0">
                              <p class="text-sm text-gray-700 dark:text-gray-300"><span v-if="tranche.shares">{{ tranche.shares }} Stk.</span><span v-if="tranche.purchasePrice" class="text-gray-400"> @ {{ tranche.purchasePrice.toFixed(2) }}</span></p>
                              <span v-if="tranche.purchaseDate" class="text-xs text-gray-400">{{ tranche.purchaseDate }}</span>
                            </div>
                          </div>
                          <div class="w-28 shrink-0" /><div class="w-14 shrink-0" /><div class="w-16 shrink-0" /><div class="w-24 shrink-0" />
                          <div class="w-28 text-right shrink-0">
                            <template v-if="tranche.shares && tranche.purchasePrice && group.price != null">
                              <template v-for="tpnl in [tranchePnl(tranche, group.price)]" :key="0">
                                <p :class="tpnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">{{ tpnl >= 0 ? '+' : '' }}{{ fmt(tpnl) }}</p>
                                <p class="text-xs" :class="tpnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ ((tpnl / (tranche.purchasePrice * tranche.shares)) * 100).toFixed(2) }}%</p>
                              </template>
                            </template>
                            <span v-else class="text-gray-400 text-sm">—</span>
                          </div>
                          <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                            <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEdit(group, tranche)" />
                            <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingId === tranche.id" @click="removeFromWatchlist(tranche.id)" />
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-xs text-gray-500">
                        <div class="flex-1 min-w-0 flex items-center gap-1 pl-4">
                          <span class="font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                          <span v-if="group.totalShares" class="font-bold text-gray-800 dark:text-gray-200">{{ group.totalShares }} Stk.</span>
                          <span v-if="group.avgPurchasePrice" class="text-gray-400">· Ø {{ group.avgPurchasePrice.toFixed(2) }} {{ group.currency }}</span>
                        </div>
                        <div class="w-28 shrink-0" /><div class="w-14 shrink-0" /><div class="w-16 shrink-0" />
                        <div class="w-24 text-right shrink-0"><span v-if="group.totalShares && group.price != null" class="font-semibold text-gray-700 dark:text-gray-300">{{ fmt(group.totalShares * group.price) }} {{ group.currency }}</span></div>
                        <div class="w-28 text-right shrink-0">
                          <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                            <span class="font-semibold" :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }} ({{ groupPnlPct(group) >= 0 ? '+' : '' }}{{ groupPnlPct(group).toFixed(2) }}%)</span>
                          </template>
                        </div>
                        <div class="w-16 shrink-0" />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- Portfolio-Filter aktiv: direkte Liste -->
          <template v-else>
          <div class="hidden sm:flex items-center gap-2 px-1 mb-1 text-xs font-medium text-gray-400">
            <div class="flex-1 min-w-0">Symbol / Name</div>
            <div class="w-28 text-right shrink-0">Kurs</div>
            <div class="w-14 text-right shrink-0">
              <button class="flex items-center justify-end gap-1 w-full hover:text-gray-600 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('tagPnl')">
                Tag G/V
                <UIcon :name="watchlistSortKey === 'tagPnl' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'tagPnl' ? 'text-primary-500' : 'text-gray-300'" />
              </button>
            </div>
            <div class="w-16 text-right shrink-0">
              <button class="flex items-center justify-end gap-1 w-full hover:text-gray-600 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('shares')">
                Stück
                <UIcon :name="watchlistSortKey === 'shares' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'shares' ? 'text-primary-500' : 'text-gray-300'" />
              </button>
            </div>
            <div class="w-24 text-right shrink-0">
              <button class="flex items-center justify-end gap-1 w-full hover:text-gray-600 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('marktwert')">
                Marktwert
                <UIcon :name="watchlistSortKey === 'marktwert' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'marktwert' ? 'text-primary-500' : 'text-gray-300'" />
              </button>
            </div>
            <div class="w-28 text-right shrink-0">
              <button class="flex items-center justify-end gap-1 w-full hover:text-gray-600 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('pnl')">
                Gewinn / Verlust
                <UIcon :name="watchlistSortKey === 'pnl' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'pnl' ? 'text-primary-500' : 'text-gray-300'" />
              </button>
            </div>
            <div class="w-16 shrink-0" />
          </div>

          <div class="space-y-2">
            <template v-for="group in filteredWatchlist" :key="group.symbol">

              <!-- Single tranche: flat row -->
              <div v-if="group.tranches.length === 1" class="py-3 flex items-center gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="font-medium cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                      @click="navigateTo(`/stocks/${group.symbol}`)"
                    >{{ group.symbol }}</span>
                    <template v-if="!activePortfolioId && portfolioById(group.tranches[0].portfolioId)">
                      <template v-for="p0 in [portfolioById(group.tranches[0].portfolioId)!]" :key="p0.id">
                        <span
                          class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          :style="{ backgroundColor: colorHex(p0.color) + '22', color: colorHex(p0.color) }"
                        >
                          <span class="w-1.5 h-1.5 rounded-full inline-block shrink-0" :style="{ backgroundColor: colorHex(p0.color) }" />
                          {{ p0.name }}
                        </span>
                      </template>
                    </template>
                  </div>
                  <p class="text-xs text-gray-400 truncate">{{ group.name }}</p>
                </div>
                <div class="w-28 text-right shrink-0">
                  <span v-if="group.price != null" :class="(group.changePercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">
                    {{ group.price.toFixed(2) }} <span class="text-xs text-gray-400">{{ group.currency }}</span>
                  </span>
                  <span v-else class="text-gray-400 text-sm">—</span>
                  <p v-if="group.changePercent != null" class="text-xs" :class="group.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                    {{ group.changePercent >= 0 ? '+' : '' }}{{ group.changePercent.toFixed(2) }}%
                  </p>
                </div>
                <div class="w-14 text-right shrink-0">
                  <span v-if="group.totalShares && group.changePercent != null && group.price != null" class="text-sm font-medium" :class="groupTagPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                    {{ groupTagPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupTagPnl(group)) }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </div>
                <div class="w-16 text-right shrink-0">
                  <span v-if="group.totalShares" class="text-sm">{{ group.totalShares }} Stk.</span>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </div>
                <div class="w-24 text-right shrink-0">
                  <span v-if="group.totalShares && group.price != null" class="font-semibold text-sm">
                    {{ fmt(group.totalShares * group.price) }} <span class="text-xs font-normal text-gray-400">{{ group.currency }}</span>
                  </span>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </div>
                <div class="w-28 text-right shrink-0">
                  <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                    <p :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">
                      {{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }}
                    </p>
                    <p class="text-xs" :class="groupPnlPct(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ groupPnlPct(group) >= 0 ? '+' : '' }}{{ groupPnlPct(group).toFixed(2) }}%
                    </p>
                  </template>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </div>
                <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                  <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEdit(group, group.tranches[0])" />
                  <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingId === group.tranches[0].id" @click="removeFromWatchlist(group.tranches[0].id)" />
                </div>
              </div>

              <!-- Multiple tranches: grouped card -->
              <div v-else class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Group header -->
                <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="font-semibold text-sm cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        @click="navigateTo(`/stocks/${group.symbol}`)"
                      >{{ group.symbol }}</span>
                      <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 font-medium">{{ group.tranches.length }}×</span>
                      <span class="text-xs text-gray-400 hidden sm:inline truncate">{{ group.name }}</span>
                    </div>
                  </div>
                  <div class="w-28 text-right shrink-0">
                    <span v-if="group.price != null" :class="(group.changePercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">
                      {{ group.price.toFixed(2) }} <span class="text-xs text-gray-400">{{ group.currency }}</span>
                    </span>
                    <p v-if="group.changePercent != null" class="text-xs" :class="group.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ group.changePercent >= 0 ? '+' : '' }}{{ group.changePercent.toFixed(2) }}%
                    </p>
                  </div>
                  <div class="w-14 text-right shrink-0">
                    <span v-if="group.totalShares && group.changePercent != null && group.price != null" class="text-sm font-medium" :class="groupTagPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ groupTagPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupTagPnl(group)) }}
                    </span>
                  </div>
                  <div class="w-16 text-right shrink-0">
                    <span v-if="group.totalShares" class="font-semibold text-sm">{{ group.totalShares }} Stk.</span>
                  </div>
                  <div class="w-24 text-right shrink-0">
                    <span v-if="group.totalShares && group.price != null" class="font-bold text-sm">
                      {{ fmt(group.totalShares * group.price) }}
                    </span>
                  </div>
                  <div class="w-28 text-right shrink-0">
                    <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                      <p :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-bold text-sm">
                        {{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }}
                      </p>
                      <p class="text-xs text-gray-400">Ø {{ group.avgPurchasePrice.toFixed(2) }}</p>
                    </template>
                  </div>
                  <div class="w-16 shrink-0" />
                </div>

                <!-- Tranche rows -->
                <div class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="tranche in group.tranches" :key="tranche.id" class="py-2.5 px-4 flex items-center gap-2">
                    <div class="flex-1 min-w-0 flex items-center gap-3">
                      <div class="w-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                      <div class="min-w-0">
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          <span v-if="tranche.shares">{{ tranche.shares }} Stk.</span>
                          <span v-if="tranche.purchasePrice" class="text-gray-400"> @ {{ tranche.purchasePrice.toFixed(2) }}</span>
                        </p>
                        <div class="flex items-center gap-2 flex-wrap mt-0.5">
                          <span v-if="tranche.purchaseDate" class="text-xs text-gray-400">{{ tranche.purchaseDate }}</span>
                          <template v-if="!activePortfolioId && portfolioById(tranche.portfolioId)">
                            <template v-for="pt in [portfolioById(tranche.portfolioId)!]" :key="pt.id">
                              <span
                                class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                                :style="{ backgroundColor: colorHex(pt.color) + '22', color: colorHex(pt.color) }"
                              >
                                <span class="w-1.5 h-1.5 rounded-full inline-block" :style="{ backgroundColor: colorHex(pt.color) }" />
                                {{ pt.name }}
                              </span>
                            </template>
                          </template>
                        </div>
                      </div>
                    </div>
                    <div class="w-28 shrink-0" />
                    <div class="w-14 shrink-0" />
                    <div class="w-16 shrink-0" />
                    <div class="w-24 shrink-0" />
                    <div class="w-28 text-right shrink-0">
                      <template v-if="tranche.shares && tranche.purchasePrice && group.price != null">
                        <template v-for="tpnl in [tranchePnl(tranche, group.price)]" :key="0">
                          <p :class="tpnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium text-sm">
                            {{ tpnl >= 0 ? '+' : '' }}{{ fmt(tpnl) }}
                          </p>
                          <p class="text-xs" :class="tpnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                            {{ ((tpnl / (tranche.purchasePrice * tranche.shares)) * 100).toFixed(2) }}%
                          </p>
                        </template>
                      </template>
                      <span v-else class="text-gray-400 text-sm">—</span>
                    </div>
                    <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                      <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEdit(group, tranche)" />
                      <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingId === tranche.id" @click="removeFromWatchlist(tranche.id)" />
                    </div>
                  </div>
                </div>

                <!-- Total summary row -->
                <div class="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-xs text-gray-500">
                  <div class="flex-1 min-w-0 flex items-center gap-1 pl-4">
                    <span class="font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                    <span v-if="group.totalShares" class="font-bold text-gray-800 dark:text-gray-200">{{ group.totalShares }} Stk.</span>
                    <span v-if="group.avgPurchasePrice" class="text-gray-400">· Ø {{ group.avgPurchasePrice.toFixed(2) }} {{ group.currency }}</span>
                  </div>
                  <div class="w-28 shrink-0" />
                  <div class="w-14 shrink-0" />
                  <div class="w-16 shrink-0" />
                  <div class="w-24 text-right shrink-0">
                    <span v-if="group.totalShares && group.price != null" class="font-semibold text-gray-700 dark:text-gray-300">
                      {{ fmt(group.totalShares * group.price) }} {{ group.currency }}
                    </span>
                  </div>
                  <div class="w-28 text-right shrink-0">
                    <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                      <span class="font-semibold" :class="groupPnl(group) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                        {{ groupPnl(group) >= 0 ? '+' : '' }}{{ fmt(groupPnl(group)) }}
                        ({{ groupPnlPct(group) >= 0 ? '+' : '' }}{{ groupPnlPct(group).toFixed(2) }}%)
                      </span>
                    </template>
                  </div>
                  <div class="w-16 shrink-0" />
                </div>
              </div>

            </template>
          </div>
          </template>

        </template>
        </div>

      </UCard>

      <!-- Erwartete Dividenden (visuell verbunden mit Meine Aktien) -->
      <div class="border border-t-0 border-gray-200 dark:border-gray-800 rounded-b-lg bg-default overflow-hidden -mt-px">
        <button class="w-full flex items-center justify-between px-4 py-3" @click="dividendenOpen = !dividendenOpen">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-trending-up" class="text-green-500" />
            <div class="text-left">
              <h2 class="font-semibold">Erwartete Dividenden {{ currentYear }}</h2>
              <p v-if="!dividendenOpen && totalDividendChf > 0" class="text-xs text-gray-400">ca. {{ fmt(totalDividendChf) }} CHF / Jahr</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton v-if="dividendenOpen" variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="dividendsPending" @click.stop="refreshDividends()" />
            <UIcon :name="dividendenOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400" />
          </div>
        </button>
        <div v-if="dividendenOpen" class="px-4 pb-4">
          <div v-if="dividendsPending && !dividends.length" class="py-6 flex justify-center">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
          </div>
          <p v-else-if="!dividends.length" class="text-sm text-gray-500 py-4 text-center">
            Keine Dividendendaten verfügbar. Kaufpreis und Datum in der Watchlist eintragen.
          </p>
          <template v-else>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div v-for="d in dividends" :key="d.symbol" class="py-3 flex items-center justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm">{{ d.symbol }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ d.name }}</p>
                </div>
                <div v-if="d.exDate || d.payDate" class="text-right text-xs text-gray-500 shrink-0 w-32">
                  <p v-if="d.exDate">Ex: {{ d.exDate }}</p>
                  <p v-if="d.payDate">Zahlung: {{ d.payDate }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-semibold">{{ fmt(toChf(d.annualDividend ?? 0, d.currency)) }} CHF</p>
                  <p v-if="d.yield" class="text-xs text-gray-400">{{ d.yield.toFixed(2) }}% Rendite</p>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p class="text-sm text-gray-500">Geschätzte Jahresdividende</p>
              <p class="font-bold text-sm">≈ {{ fmt(totalDividendChf) }} CHF</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Cashquote -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-wallet" class="text-blue-500" />
              <h2 class="font-semibold">Cashquote</h2>
            </div>
            <UButton icon="i-lucide-plus" size="sm" variant="ghost" @click="showAddCashRow = !showAddCashRow">Hinzufügen</UButton>
          </div>
        </template>
        <p v-if="!filteredCashEntries.length && !showAddCashRow" class="text-sm text-gray-500 py-2 text-center">Noch kein Cash erfasst.</p>
        <div v-else class="space-y-1">
          <div v-for="c in filteredCashEntries" :key="c.id" class="flex items-center gap-3 py-1.5">
            <template v-if="editingCashId === c.id">
              <UInput v-model="inlineEditForm.label" placeholder="Bezeichnung" class="flex-1" size="sm" />
              <UInput v-model="inlineEditForm.amount" type="number" step="0.01" class="w-28" size="sm" />
              <USelect v-model="inlineEditForm.currency" :items="currencyOptions" size="sm" class="w-20" />
              <UButton size="sm" @click="saveInlineCash(c.id)">OK</UButton>
              <UButton size="sm" variant="ghost" color="neutral" @click="editingCashId = null">Abbrechen</UButton>
            </template>
            <template v-else>
              <p class="flex-1 text-sm">{{ c.label || 'Cash' }}</p>
              <p class="text-sm font-medium">{{ fmt(c.amount) }} <span class="text-xs text-gray-400">{{ c.currency }}</span></p>
              <p v-if="c.currency !== 'CHF'" class="text-xs text-gray-400">= {{ fmt(toChf(c.amount, c.currency)) }} CHF</p>
              <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startEditCash(c)" />
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingCashId === c.id" @click="deleteCash(c.id)" />
            </template>
          </div>
          <div v-if="showAddCashRow" class="flex items-center gap-3 py-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <UInput v-model="newCashForm.label" placeholder="Bezeichnung (z.B. Konto)" class="flex-1" size="sm" />
            <UInput v-model="newCashForm.amount" type="number" step="0.01" placeholder="Betrag" class="w-28" size="sm" />
            <USelect v-model="newCashForm.currency" :items="currencyOptions" size="sm" class="w-20" />
            <UButton size="sm" :loading="savingCash" @click="addCashEntry">Hinzufügen</UButton>
            <UButton size="sm" variant="ghost" color="neutral" @click="showAddCashRow = false">Abbrechen</UButton>
          </div>
        </div>
        <template v-if="filteredCashEntries.length" #footer>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total Cash</span>
            <div class="text-right">
              <span class="font-bold">{{ fmt(totalCashChf) }} CHF</span>
              <span v-if="cashQuotePct > 0" class="text-xs text-gray-400 ml-2">({{ cashQuotePct.toFixed(1) }}% Quote)</span>
            </div>
          </div>
        </template>
      </UCard>

      <!-- Säule 3A -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-piggy-bank" class="text-emerald-500" />
              <h2 class="font-semibold">Säule 3A</h2>
            </div>
            <UButton icon="i-lucide-plus" size="sm" variant="ghost" @click="showAddSaule3aRow = !showAddSaule3aRow">Hinzufügen</UButton>
          </div>
        </template>
        <p v-if="!saule3aEntries.length && !showAddSaule3aRow" class="text-sm text-gray-500 py-2 text-center">Noch keine Säule 3A Einträge.</p>
        <div v-else class="space-y-1">
          <div v-for="e in saule3aEntries" :key="e.id" class="flex items-center gap-3 py-1.5">
            <template v-if="editingSaule3aId === e.id">
              <UInput v-model="saule3aEditForm.label" placeholder="Bezeichnung" class="flex-1" size="sm" />
              <UInput v-model="saule3aEditForm.amount" type="number" step="0.01" class="w-32" size="sm" />
              <span class="text-xs text-gray-400">CHF</span>
              <UButton size="sm" @click="saveSaule3aEdit(e.id)">OK</UButton>
              <UButton size="sm" variant="ghost" color="neutral" @click="editingSaule3aId = null">Abbrechen</UButton>
            </template>
            <template v-else>
              <p class="flex-1 text-sm">{{ e.label || 'Säule 3A' }}</p>
              <p class="text-sm font-medium">{{ fmt(e.amount) }} <span class="text-xs text-gray-400">CHF</span></p>
              <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="startSaule3aEdit(e)" />
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="deletingSaule3aId === e.id" @click="deleteSaule3aEntry(e.id)" />
            </template>
          </div>
          <div v-if="showAddSaule3aRow" class="flex items-center gap-3 py-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <UInput v-model="newSaule3aForm.label" placeholder="Bezeichnung (z.B. VIAC)" class="flex-1" size="sm" />
            <UInput v-model="newSaule3aForm.amount" type="number" step="0.01" placeholder="Betrag" class="w-32" size="sm" />
            <span class="text-xs text-gray-400">CHF</span>
            <UButton size="sm" :loading="savingSaule3a" @click="addSaule3aEntry">Hinzufügen</UButton>
            <UButton size="sm" variant="ghost" color="neutral" @click="showAddSaule3aRow = false">Abbrechen</UButton>
          </div>
        </div>
        <template v-if="saule3aEntries.length" #footer>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total Säule 3A</span>
            <span class="font-bold">{{ fmt(totalSaule3a) }} CHF</span>
          </div>
        </template>
      </UCard>

    </div>
  </div>

  <!-- Edit modal -->
  <UModal v-model:open="editOpen" title="Position bearbeiten">
    <template #body>
      <div v-if="editItem" class="space-y-4">
        <div>
          <p class="text-sm font-medium mb-0.5">{{ editItem.symbol }}</p>
          <p class="text-xs text-gray-500">{{ editItem.name }}</p>
        </div>
        <UFormField label="Portfolio">
          <USelect
            v-model="editForm.portfolioId"
            :items="[{ label: 'Kein Portfolio', value: 'none' }, ...portfolios.map(p => ({ label: p.name, value: p.id }))]"
          />
        </UFormField>
        <UFormField label="Anzahl Aktien">
          <UInput v-model="editForm.shares" type="number" step="0.0001" placeholder="z.B. 10" />
        </UFormField>
        <UFormField label="Kaufdatum">
          <DatePicker v-model="editForm.purchaseDate" @select="fetchPriceAtDate" />
        </UFormField>
        <UFormField label="Kaufpreis pro Aktie">
          <UInput
            v-model="editForm.purchasePrice"
            type="number"
            step="0.01"
            :placeholder="priceLoading ? 'Wird geladen…' : `z.B. 85.50 ${editItem.currency}`"
          />
          <p v-if="priceLoading" class="text-xs text-gray-400 mt-1">Kurs wird abgerufen…</p>
          <p v-else-if="editForm.purchaseDate && editForm.purchasePrice" class="text-xs text-gray-400 mt-1">
            Schlusskurs vom {{ editForm.purchaseDate }} — kann manuell überschrieben werden.
          </p>
          <p v-else-if="editForm.purchaseDate && !editForm.purchasePrice" class="text-xs text-orange-400 mt-1">
            Kein Kurs gefunden — bitte manuell eingeben.
          </p>
        </UFormField>
        <div v-if="editForm.shares && editForm.purchasePrice" class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500">Investiert</span>
            <span class="font-medium">{{ fmt(Number(editForm.shares) * Number(editForm.purchasePrice)) }}</span>
          </div>
          <div v-if="editItem.price != null" class="flex justify-between">
            <span class="text-gray-500">Aktueller Wert</span>
            <span class="font-medium">{{ fmt(Number(editForm.shares) * editItem.price) }}</span>
          </div>
          <div v-if="editItem.price != null" class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
            <span class="text-gray-500">Gewinn / Verlust</span>
            <span
              class="font-semibold"
              :class="previewPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'"
            >
              {{ previewPnl >= 0 ? '+' : '' }}{{ fmt(previewPnl) }}
              ({{ previewPnlPct >= 0 ? '+' : '' }}{{ previewPnlPct.toFixed(2) }}%)
            </span>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="editOpen = false">Abbrechen</UButton>
        <UButton :loading="editLoading" @click="saveEdit">Speichern</UButton>
      </div>
    </template>
  </UModal>

  <!-- Edelmetall hinzufügen Modal -->
  <UModal v-model:open="addHoldingOpen" title="Edelmetall hinzufügen">
    <template #body>
      <div class="space-y-4">
        <!-- Metall-Auswahl -->
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="m in metalPickerOptions"
            :key="m.key"
            type="button"
            class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
            :class="holdingForm.metalKey === m.key
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="holdingForm.metalKey = m.key; holdingForm.coinType = ''"
          >
            <span class="text-2xl">{{ m.emoji }}</span>
            <span
              class="text-xs font-semibold"
              :class="holdingForm.metalKey === m.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'"
            >{{ m.label }}</span>
            <span class="text-xs text-gray-400 font-mono">{{ m.symbol }}</span>
          </button>
        </div>
        <UFormField label="Münze / Barren">
          <USelect v-model="holdingForm.coinType" :items="coinOptions" placeholder="Typ wählen" class="w-full" />
        </UFormField>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Menge</span>
            <button type="button" class="text-xs text-primary-500 hover:text-primary-600 font-medium" @click="holdingPiecesMode = !holdingPiecesMode">
              {{ holdingPiecesMode ? '↩ Direkt eingeben' : '🪙 Stück eingeben' }}
            </button>
          </div>
          <!-- Direkt -->
          <div v-if="!holdingPiecesMode" class="grid grid-cols-2 gap-3">
            <UInput v-model="holdingForm.quantity" type="number" step="0.001" placeholder="z.B. 10" />
            <USelect v-model="holdingForm.unit" :items="unitOptions" />
          </div>
          <!-- Stück-Modus -->
          <div v-else class="space-y-2">
            <div class="flex items-center gap-2">
              <UInput v-model="holdingPieces.count" type="number" step="1" min="1" placeholder="Stk." class="w-24" @input="calcPieces" />
              <span class="text-sm text-gray-400 shrink-0">Stk. ×</span>
              <UInput v-model="holdingPieces.weight" type="number" step="0.001" placeholder="Gewicht" class="flex-1" @input="calcPieces" />
              <USelect v-model="holdingForm.unit" :items="unitOptions" class="w-32" @change="calcPieces" />
            </div>
            <p v-if="holdingForm.quantity" class="text-xs text-gray-500">
              Gesamt: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ holdingForm.quantity }} {{ holdingForm.unit }}</span>
            </p>
          </div>
        </div>
        <UFormField label="Kaufdatum">
          <DatePicker v-model="holdingForm.purchaseDate" @select="fetchMetalPriceAtDateAdd" />
        </UFormField>
        <UFormField :label="`Kaufpreis pro ${holdingForm.unit}`">
          <UInput
            v-model="holdingForm.purchasePricePerOz"
            type="number"
            step="0.01"
            :placeholder="holdingPriceLoading ? 'Wird geladen…' : 'z.B. 2800.00'"
          />
          <p v-if="holdingPriceLoading" class="text-xs text-gray-400 mt-1">Kurs wird abgerufen…</p>
          <p v-else-if="holdingForm.purchaseDate && holdingForm.purchasePricePerOz" class="text-xs text-gray-400 mt-1">
            Historischer Spot vom {{ holdingForm.purchaseDate }} — kann überschrieben werden.
          </p>
        </UFormField>
        <UFormField label="Kaufwährung">
          <USelect v-model="holdingForm.purchaseCurrency" :items="currencyOptions" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="addHoldingOpen = false">Abbrechen</UButton>
        <UButton :loading="addHoldingLoading" @click="saveHolding">Hinzufügen</UButton>
      </div>
    </template>
  </UModal>

  <!-- Edelmetall bearbeiten Modal -->
  <UModal v-model:open="editHoldingOpen" title="Edelmetall bearbeiten">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Münze / Barren">
          <USelect v-model="editHoldingForm.coinType" :items="editCoinOptions" placeholder="Typ wählen" class="w-full" />
        </UFormField>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Menge</span>
            <button type="button" class="text-xs text-primary-500 hover:text-primary-600 font-medium" @click="editHoldingPiecesMode = !editHoldingPiecesMode">
              {{ editHoldingPiecesMode ? '↩ Direkt eingeben' : '🪙 Stück eingeben' }}
            </button>
          </div>
          <!-- Direkt -->
          <div v-if="!editHoldingPiecesMode" class="grid grid-cols-2 gap-3">
            <UInput v-model="editHoldingForm.quantity" type="number" step="0.001" placeholder="z.B. 10" />
            <USelect v-model="editHoldingForm.unit" :items="unitOptions" />
          </div>
          <!-- Stück-Modus -->
          <div v-else class="space-y-2">
            <div class="flex items-center gap-2">
              <UInput v-model="editHoldingPieces.count" type="number" step="1" min="1" placeholder="Stk." class="w-24" @input="calcEditPieces" />
              <span class="text-sm text-gray-400 shrink-0">Stk. ×</span>
              <UInput v-model="editHoldingPieces.weight" type="number" step="0.001" placeholder="Gewicht" class="flex-1" @input="calcEditPieces" />
              <USelect v-model="editHoldingForm.unit" :items="unitOptions" class="w-32" @change="calcEditPieces" />
            </div>
            <p v-if="editHoldingForm.quantity" class="text-xs text-gray-500">
              Gesamt: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ editHoldingForm.quantity }} {{ editHoldingForm.unit }}</span>
            </p>
          </div>
        </div>
        <UFormField label="Kaufdatum">
          <DatePicker v-model="editHoldingForm.purchaseDate" @select="fetchMetalPriceAtDateEdit" />
        </UFormField>
        <UFormField :label="`Kaufpreis pro ${editHoldingForm.unit}`">
          <UInput
            v-model="editHoldingForm.purchasePricePerOz"
            type="number"
            step="0.01"
            :placeholder="editHoldingPriceLoading ? 'Wird geladen…' : 'z.B. 2800.00'"
          />
          <p v-if="editHoldingPriceLoading" class="text-xs text-gray-400 mt-1">Kurs wird abgerufen…</p>
          <p v-else-if="editHoldingForm.purchaseDate && editHoldingForm.purchasePricePerOz" class="text-xs text-gray-400 mt-1">
            Historischer Spot vom {{ editHoldingForm.purchaseDate }} — kann überschrieben werden.
          </p>
        </UFormField>
        <UFormField label="Kaufwährung">
          <USelect v-model="editHoldingForm.purchaseCurrency" :items="currencyOptions" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="editHoldingOpen = false">Abbrechen</UButton>
        <UButton :loading="editHoldingLoading" @click="saveEditHolding">Speichern</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

interface WatchlistTranche {
  id: string
  shares: number | null
  purchasePrice: number | null
  purchaseDate: string | null
  portfolioId: string | null
  createdAt: string | Date
}

interface WatchlistGroup {
  symbol: string
  name: string
  exchange: string
  currency: string
  price: number | null
  changePercent: number | null
  totalShares: number | null
  avgPurchasePrice: number | null
  tranches: WatchlistTranche[]
}

const headers = useRequestHeaders(['cookie'])
const toast = useToast()

// Portfolios
const portfolioColors = [
  { value: 'blue',   hex: '#3b82f6' },
  { value: 'green',  hex: '#22c55e' },
  { value: 'yellow', hex: '#eab308' },
  { value: 'red',    hex: '#ef4444' },
  { value: 'purple', hex: '#a855f7' },
  { value: 'orange', hex: '#f97316' },
  { value: 'neutral',hex: '#6b7280' },
]
const colorHex = (c: string) => portfolioColors.find(p => p.value === c)?.hex ?? '#6b7280'
const portfolioById = (id: string | null) => id ? portfolios.value.find(p => p.id === id) : null

const { data: portfoliosData, refresh: refreshPortfolios } = await useFetch<any[]>('/api/portfolios', { headers })
const portfolios = computed(() => portfoliosData.value ?? [])

const activePortfolioId = ref<string | null>(null)
const sortByPortfolio = ref(true)

// Edelmetalle
const currencyOptions = ['CHF', 'USD', 'EUR', 'GBP']
const metalCurrency = ref('CHF')

const { data: metalsData, pending: metalsPending, refresh: refreshMetals } = await useFetch(
  () => `/api/metals/spot?currency=${metalCurrency.value}`,
  { headers, watch: [metalCurrency] }
)
const metals = computed(() => (metalsData.value as any[]) ?? [])

const metalIcon = (key: string) => ({ gold: '🥇', silver: '🥈', platinum: '⚪', palladium: '🔵' }[key] ?? '●')
const metalName = (key: string) => ({ gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium' }[key] ?? key)

const fmtMetal = (val: number) =>
  val.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// gold.ch Händlerpreise
const goldchOpen = ref(false)
const { data: goldchData, pending: goldchPending, refresh: refreshGoldch } = await useFetch('/api/metals/goldch', { headers })
const goldchPrices = computed(() => (goldchData.value as any[]) ?? [])
const goldchSections = computed(() => {
  const map = new Map<string, { name: string; items: any[] }>()
  for (const item of goldchPrices.value) {
    if (!map.has(item.section)) map.set(item.section, { name: item.section, items: [] })
    map.get(item.section)!.items.push(item)
  }
  return Array.from(map.values())
})

// Edelmetall-Portfolio
const edelmetalleOpen = ref(false)
const openMetalGroups = ref(new Set<string>())
function toggleMetalGroup(metalKey: string) {
  if (openMetalGroups.value.has(metalKey)) openMetalGroups.value.delete(metalKey)
  else openMetalGroups.value.add(metalKey)
}

const holdingCurrency = ref('CHF')

const { data: holdingsData, pending: holdingsPending, refresh: refreshHoldings } = await useFetch(
  () => `/api/metals/holdings?currency=${holdingCurrency.value}`,
  { headers, watch: [holdingCurrency] }
)
const holdings = computed(() => (holdingsData.value as any[]) ?? [])
const holdingSortKey = ref<'metal' | 'date' | 'value' | null>(null)
const holdingSortDir = ref<'asc' | 'desc'>('asc')

function toggleHoldingSort(key: 'metal' | 'date' | 'value') {
  if (holdingSortKey.value === key) {
    holdingSortDir.value = holdingSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    holdingSortKey.value = key
    holdingSortDir.value = 'asc'
  }
}

const filteredHoldings = computed(() => {
  const arr = holdings.value.filter((h: any) => !activeMetalFilter.value || h.metalKey === activeMetalFilter.value)
  const dir = holdingSortDir.value === 'asc' ? 1 : -1
  if (holdingSortKey.value === 'metal') {
    arr.sort((a, b) => a.metalKey.localeCompare(b.metalKey) * dir)
  } else if (holdingSortKey.value === 'date') {
    arr.sort((a, b) => {
      const da = a.purchaseDate ?? ''
      const db = b.purchaseDate ?? ''
      return da.localeCompare(db) * dir
    })
  } else if (holdingSortKey.value === 'value') {
    arr.sort((a, b) => ((a.currentTotal ?? 0) - (b.currentTotal ?? 0)) * dir)
  }
  return arr
})

const holdingTotalValue = computed(() =>
  holdings.value.reduce((s: number, h: any) => s + (h.currentTotal ?? 0), 0)
)
const holdingTotalInvested = computed(() =>
  holdings.value.filter((h: any) => h.purchasePricePerOz && h.purchaseCurrency === holdingCurrency.value)
    .reduce((s: number, h: any) => {
      const G_PER_OZ = 31.1035
      const oz = h.unit === 'g' ? h.quantity / G_PER_OZ : h.unit === 'kg' ? h.quantity / G_PER_OZ * 1000 : h.quantity
      return s + h.purchasePricePerOz * oz
    }, 0)
)
const holdingTotalPnl = computed(() => holdingTotalValue.value - holdingTotalInvested.value)
const holdingTotalPnlPct = computed(() =>
  holdingTotalInvested.value > 0 ? (holdingTotalPnl.value / holdingTotalInvested.value) * 100 : 0
)

const summaryUnit = ref<'oz' | 'g' | 'kg'>('oz')
const activeMetalFilter = ref<string | null>(null)

function fmtSummaryQty(totalOz: number): string {
  let val: number
  if (summaryUnit.value === 'g') val = totalOz * G_PER_OZ
  else if (summaryUnit.value === 'kg') val = totalOz * G_PER_OZ / 1000
  else val = totalOz
  return val.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
}

const holdingMetalSummary = computed(() => {
  const map = new Map<string, { totalOz: number; totalValue: number; types: Set<string>; entries: number }>()
  for (const h of holdings.value as any[]) {
    if (!map.has(h.metalKey)) map.set(h.metalKey, { totalOz: 0, totalValue: 0, types: new Set(), entries: 0 })
    const m = map.get(h.metalKey)!
    const oz = h.unit === 'g' ? h.quantity / G_PER_OZ
             : h.unit === 'kg' ? h.quantity * 1000 / G_PER_OZ
             : h.quantity
    m.totalOz += oz
    m.totalValue += h.currentTotal ?? 0
    if (h.coinType) m.types.add(h.coinType)
    m.entries++
  }
  const totalValue = Array.from(map.values()).reduce((s, m) => s + m.totalValue, 0)
  const order = ['gold', 'silver', 'platinum', 'palladium']
  return Array.from(map.entries())
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([metalKey, v]) => ({
      metalKey,
      totalOz: Math.round(v.totalOz * 1000) / 1000,
      totalValue: v.totalValue,
      pct: totalValue > 0 ? (v.totalValue / totalValue) * 100 : 0,
      types: v.types.size,
      entries: v.entries,
    }))
})

const groupedHoldings = computed(() => {
  const groups = new Map<string, { metalKey: string; coinType: string; items: any[] }>()
  for (const h of filteredHoldings.value) {
    const key = `${h.metalKey}|${h.coinType ?? ''}`
    if (!groups.has(key)) groups.set(key, { metalKey: h.metalKey, coinType: h.coinType ?? '', items: [] })
    groups.get(key)!.items.push(h)
  }
  return Array.from(groups.values())
})

const holdingsByMetal = computed(() => {
  const map = new Map<string, any[]>()
  for (const h of filteredHoldings.value) {
    if (!map.has(h.metalKey)) map.set(h.metalKey, [])
    map.get(h.metalKey)!.push(h)
  }
  const order = ['gold', 'silver', 'platinum', 'palladium']
  return Array.from(map.entries())
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([metalKey, items]) => {
      const cgMap = new Map<string, any[]>()
      for (const h of items) {
        const key = `${metalKey}|${h.coinType ?? ''}`
        if (!cgMap.has(key)) cgMap.set(key, [])
        cgMap.get(key)!.push(h)
      }
      return {
        metalKey,
        items,
        totalValue: items.reduce((s: number, h: any) => s + (h.currentTotal ?? 0), 0),
        coinGroups: Array.from(cgMap.entries()).map(([key, citems]) => ({
          key,
          metalKey,
          coinType: citems[0]?.coinType ?? '',
          items: citems,
        })),
      }
    })
})

const removingHoldingId = ref<string | null>(null)
async function removeHolding(id: string) {
  removingHoldingId.value = id
  try {
    await $fetch(`/api/metals/holdings/${id}`, { method: 'DELETE' })
    await refreshHoldings()
  } finally {
    removingHoldingId.value = null
  }
}

// Price unit conversion helpers (DB always stores per oz)
const G_PER_OZ = 31.1035
function priceToPerOz(price: number, unit: string): number {
  if (unit === 'g') return price * G_PER_OZ
  if (unit === 'kg') return price * G_PER_OZ / 1000
  return price
}
function priceFromPerOz(pricePerOz: number, unit: string): number {
  if (unit === 'g') return pricePerOz / G_PER_OZ
  if (unit === 'kg') return pricePerOz / G_PER_OZ * 1000
  return pricePerOz
}

// Add holding modal
const metalOptions = [
  { label: '🥇 Gold', value: 'gold' },
  { label: '🥈 Silber', value: 'silver' },
  { label: '⚪ Platin', value: 'platinum' },
  { label: '🔵 Palladium', value: 'palladium' },
]

const metalPickerOptions = [
  { key: 'gold',      emoji: '🥇', label: 'Gold',      symbol: 'XAU' },
  { key: 'silver',    emoji: '🥈', label: 'Silber',    symbol: 'XAG' },
  { key: 'platinum',  emoji: '⚪', label: 'Platin',    symbol: 'XPT' },
  { key: 'palladium', emoji: '🔵', label: 'Palladium', symbol: 'XPD' },
]
const unitOptions = [
  { label: 'Gramm (g)', value: 'g' },
  { label: 'Kilogramm (kg)', value: 'kg' },
  { label: 'Feinunze (oz)', value: 'oz' },
]
const COIN_OPTIONS: Record<string, string[]> = {
  gold: ['Goldbarren', 'Krugerrand', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'American Buffalo', 'Britannia', 'Vreneli 20Fr', 'Vreneli 10Fr', 'Nugget/Känguru', 'Sonstige'],
  silver: ['Silberbarren', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'Britannia', 'Krugerrand', 'Sonstige'],
  platinum: ['Platinbarren', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'Sonstige'],
  palladium: ['Palladiumbarren', 'Maple Leaf', 'Sonstige'],
}

const addHoldingOpen = ref(false)
const addHoldingLoading = ref(false)
const holdingPriceLoading = ref(false)
const holdingPiecesMode = ref(false)
const holdingPieces = reactive({ count: '', weight: '' })
function calcPieces() {
  const c = parseFloat(holdingPieces.count)
  const w = parseFloat(holdingPieces.weight)
  if (c > 0 && w > 0) holdingForm.quantity = String(Math.round(c * w * 100000) / 100000)
}
const holdingForm = reactive({
  metalKey: 'gold',
  coinType: '',
  quantity: '',
  unit: 'oz',
  purchaseDate: '',
  purchasePricePerOz: '',
  purchaseCurrency: 'CHF',
})

const coinOptions = computed(() =>
  (COIN_OPTIONS[holdingForm.metalKey] ?? []).map(c => ({ label: c, value: c }))
)

async function fetchMetalPriceAtDate(
  form: { metalKey: string; purchaseDate: string; purchaseCurrency: string; unit: string; purchasePricePerOz: string },
  loadingRef: { value: boolean }
) {
  if (!form.metalKey || !form.purchaseDate) return
  loadingRef.value = true
  form.purchasePricePerOz = ''
  try {
    const res = await $fetch<{ price: number | null }>(`/api/metals/price-at?metalKey=${form.metalKey}&date=${form.purchaseDate}&currency=${form.purchaseCurrency}`)
    if (res.price != null) form.purchasePricePerOz = priceFromPerOz(res.price, form.unit).toFixed(4)
  } catch {
    toast.add({ title: 'Kurs nicht verfügbar', description: 'Bitte Kaufpreis manuell eingeben.', color: 'warning' })
  } finally {
    loadingRef.value = false
  }
}

function fetchMetalPriceAtDateAdd() {
  return fetchMetalPriceAtDate(holdingForm, holdingPriceLoading)
}

function fetchMetalPriceAtDateEdit() {
  return fetchMetalPriceAtDate(editHoldingForm, editHoldingPriceLoading)
}

async function saveHolding() {
  if (!holdingForm.quantity) return
  addHoldingLoading.value = true
  try {
    await $fetch('/api/metals/holdings', {
      method: 'POST',
      body: {
        metalKey: holdingForm.metalKey,
        coinType: holdingForm.coinType,
        quantity: Number(holdingForm.quantity),
        unit: holdingForm.unit,
        purchaseDate: holdingForm.purchaseDate || null,
        purchasePricePerOz: holdingForm.purchasePricePerOz ? priceToPerOz(Number(holdingForm.purchasePricePerOz), holdingForm.unit) : null,
        purchaseCurrency: holdingForm.purchaseCurrency,
      },
    })
    await refreshHoldings()
    addHoldingOpen.value = false
    Object.assign(holdingForm, { metalKey: 'gold', coinType: '', quantity: '', unit: 'oz', purchaseDate: '', purchasePricePerOz: '', purchaseCurrency: 'CHF' })
    holdingPiecesMode.value = false
    Object.assign(holdingPieces, { count: '', weight: '' })
  } finally {
    addHoldingLoading.value = false
  }
}

// Edit holding modal
const editHoldingOpen = ref(false)
const editHoldingLoading = ref(false)
const editHoldingId = ref<string | null>(null)
const editHoldingPriceLoading = ref(false)
const editHoldingPiecesMode = ref(false)
const editHoldingPieces = reactive({ count: '', weight: '' })
function calcEditPieces() {
  const c = parseFloat(editHoldingPieces.count)
  const w = parseFloat(editHoldingPieces.weight)
  if (c > 0 && w > 0) editHoldingForm.quantity = String(Math.round(c * w * 100000) / 100000)
}
const editHoldingForm = reactive({
  metalKey: 'gold',
  coinType: '',
  quantity: '',
  unit: 'oz',
  purchaseDate: '',
  purchasePricePerOz: '',
  purchaseCurrency: 'CHF',
})

const editCoinOptions = computed(() =>
  (COIN_OPTIONS[editHoldingForm.metalKey] ?? []).map(c => ({ label: c, value: c }))
)

function openEditHolding(h: any) {
  editHoldingId.value = h.id
  editHoldingForm.metalKey = h.metalKey
  editHoldingForm.coinType = h.coinType ?? ''
  editHoldingForm.quantity = String(h.quantity)
  editHoldingForm.unit = h.unit
  editHoldingForm.purchaseDate = h.purchaseDate ?? ''
  editHoldingForm.purchasePricePerOz = h.purchasePricePerOz != null ? priceFromPerOz(h.purchasePricePerOz, h.unit).toFixed(4) : ''
  editHoldingForm.purchaseCurrency = h.purchaseCurrency ?? 'CHF'
  editHoldingOpen.value = true
}


async function saveEditHolding() {
  if (!editHoldingId.value || !editHoldingForm.quantity) return
  editHoldingLoading.value = true
  try {
    await $fetch(`/api/metals/holdings/${editHoldingId.value}`, {
      method: 'PATCH',
      body: {
        coinType: editHoldingForm.coinType,
        quantity: Number(editHoldingForm.quantity),
        unit: editHoldingForm.unit,
        purchaseDate: editHoldingForm.purchaseDate || null,
        purchasePricePerOz: editHoldingForm.purchasePricePerOz ? priceToPerOz(Number(editHoldingForm.purchasePricePerOz), editHoldingForm.unit) : null,
        purchaseCurrency: editHoldingForm.purchaseCurrency,
      },
    })
    await refreshHoldings()
    editHoldingOpen.value = false
  } finally {
    editHoldingLoading.value = false
  }
}

// All symbols (for isInWatchlist check across all portfolios)
const { data: allSymbolsData, refresh: refreshAllSymbols } = await useFetch<WatchlistGroup[]>(
  '/api/stocks/watchlist', { headers }
)
const allSymbols = computed(() => new Set((allSymbolsData.value ?? []).map(w => w.symbol)))
const isInWatchlist = (symbol: string) => allSymbols.value.has(symbol)

// Watchlist filtered server-side by active portfolio
const { data: watchlistData, pending: watchlistPending, refresh } = await useFetch<WatchlistGroup[]>(
  () => activePortfolioId.value
    ? `/api/stocks/watchlist?portfolioId=${activePortfolioId.value}`
    : '/api/stocks/watchlist',
  { headers, watch: [activePortfolioId] }
)
const watchlist = computed(() => watchlistData.value ?? [])
const watchlistOpen = ref(false)

// Portfolio-Sektionen im "Alle"-Modus
const openPortfolioSections = ref(new Set<string>())
function togglePortfolioSection(key: string) {
  if (openPortfolioSections.value.has(key)) openPortfolioSections.value.delete(key)
  else openPortfolioSections.value.add(key)
}

const watchlistByPortfolio = computed(() => {
  const map = new Map<string, { key: string; portfolio: any; groups: WatchlistGroup[] }>()
  for (const group of filteredWatchlist.value) {
    const pid = group.tranches[0]?.portfolioId ?? null
    const key = pid ?? 'none'
    if (!map.has(key)) map.set(key, { key, portfolio: portfolioById(pid), groups: [] })
    map.get(key)!.groups.push(group)
  }
  const result: { key: string; portfolio: any; groups: WatchlistGroup[]; stats: ReturnType<typeof sectionStats> }[] = []
  for (const p of portfolios.value) {
    if (map.has(p.id)) {
      const entry = map.get(p.id)!
      result.push({ ...entry, stats: sectionStats(entry.groups) })
    }
  }
  if (map.has('none')) {
    const entry = map.get('none')!
    result.push({ ...entry, stats: sectionStats(entry.groups) })
  }
  return result
})

function sectionStats(groups: WatchlistGroup[]): { invested: number; value: number; pnl: number; pnlPct: number } {
  let invested = 0
  let value = 0
  for (const g of groups) {
    if (g.totalShares && g.avgPurchasePrice) invested += toChf(g.avgPurchasePrice * g.totalShares, g.currency)
    if (g.totalShares && g.price != null) value += toChf(g.price * g.totalShares, g.currency)
  }
  const pnl = value - invested
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
  return { invested, value, pnl, pnlPct }
}

const watchlistSortKey = ref<'shares' | 'pnl' | 'tagPnl' | 'marktwert' | null>(null)
const watchlistSortDir = ref<'asc' | 'desc'>('desc')

function toggleWatchlistSort(key: 'shares' | 'pnl' | 'tagPnl' | 'marktwert') {
  if (watchlistSortKey.value === key) watchlistSortDir.value = watchlistSortDir.value === 'asc' ? 'desc' : 'asc'
  else { watchlistSortKey.value = key; watchlistSortDir.value = 'desc' }
}

const filteredWatchlist = computed(() => {
  let arr = [...watchlist.value]
  if (sortByPortfolio.value && !watchlistSortKey.value) {
    return arr.sort((a, b) => {
      const pa = portfolioById(a.tranches[0]?.portfolioId ?? null)?.name ?? '\uFFFF'
      const pb = portfolioById(b.tranches[0]?.portfolioId ?? null)?.name ?? '\uFFFF'
      return pa.localeCompare(pb)
    })
  }
  if (watchlistSortKey.value) {
    const dir = watchlistSortDir.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (watchlistSortKey.value === 'shares') return ((a.totalShares ?? 0) - (b.totalShares ?? 0)) * dir
      if (watchlistSortKey.value === 'pnl') return (groupPnl(a) - groupPnl(b)) * dir
      if (watchlistSortKey.value === 'tagPnl') return (groupTagPnl(a) - groupTagPnl(b)) * dir
      if (watchlistSortKey.value === 'marktwert') return (((a.totalShares ?? 0) * (a.price ?? 0)) - ((b.totalShares ?? 0) * (b.price ?? 0))) * dir
      return 0
    })
  }
  return arr
})

// Group-level P&L helpers
function groupPnl(g: WatchlistGroup): number {
  if (!g.totalShares || !g.avgPurchasePrice || g.price == null) return 0
  return (g.price - g.avgPurchasePrice) * g.totalShares
}
function groupPnlPct(g: WatchlistGroup): number {
  if (!g.avgPurchasePrice) return 0
  return ((g.price! - g.avgPurchasePrice) / g.avgPurchasePrice) * 100
}
function groupTagPnl(g: WatchlistGroup): number {
  if (!g.totalShares || g.changePercent == null || g.price == null) return 0
  const dailyChange = g.price * (g.changePercent / 100) / (1 + g.changePercent / 100)
  return g.totalShares * dailyChange
}

// Tranche-level P&L helpers
function tranchePnl(t: WatchlistTranche, currentPrice: number): number {
  if (!t.shares || !t.purchasePrice) return 0
  return (currentPrice - t.purchasePrice) * t.shares
}
function tranchePnlPct(t: WatchlistTranche): number {
  if (!t.purchasePrice) return 0
  return 0 // price needed from group — calculated inline in template
}

const fmt = (val: number) =>
  val.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// FX rates → convert everything to CHF
const { data: fxData } = await useFetch<Record<string, number>>('/api/stocks/fx', { headers })
const fx = computed(() => fxData.value ?? { USD: 0.9, EUR: 0.95, GBP: 1.12, CHF: 1 })
function toChf(amount: number, currency: string): number {
  return amount * (fx.value[currency] ?? 1)
}

// Aktienportfolio tabs above summary
const aktienportfolios = computed(() => portfolios.value.filter((p: any) => p.portfolioType === 'Aktienportfolio'))

// Dividenden
const currentYear = new Date().getFullYear()
const dividendenOpen = ref(false)
const { data: dividendsData, pending: dividendsPending, refresh: refreshDividends } = await useFetch(
  () => activePortfolioId.value
    ? `/api/stocks/dividends?portfolioId=${activePortfolioId.value}`
    : '/api/stocks/dividends',
  { headers, watch: [activePortfolioId], immediate: false }
)
const dividends = computed(() => (dividendsData.value as any[]) ?? [])
const totalDividendChf = computed(() =>
  dividends.value.reduce((s: number, d: any) => s + toChf(d.annualDividend ?? 0, d.currency), 0)
)

watch(dividendenOpen, (open) => {
  if (open && !dividendsData.value) refreshDividends()
})

watch(activePortfolioId, () => {
  if (dividendenOpen.value) refreshDividends()
})

// Portfolio summary (only groups with full position data and live price)
const portfolioItems = computed(() =>
  watchlist.value.filter(g => g.totalShares && g.avgPurchasePrice && g.price != null)
)
const totalInvested = computed(() =>
  portfolioItems.value.reduce((s, g) => s + toChf(g.avgPurchasePrice! * g.totalShares!, g.currency), 0)
)
const totalStocksValue = computed(() =>
  portfolioItems.value.reduce((s, g) => s + toChf(g.price! * g.totalShares!, g.currency), 0)
)
const totalValue = computed(() => totalStocksValue.value + totalCashChf.value)

// Portfolio-Karten (Aktienportfolios mit Marktwert + G/V pro Portfolio)
const portfolioSummaryCards = computed(() =>
  aktienportfolios.value.map(p => {
    const groups = (allSymbolsData.value ?? []).filter(g =>
      g.tranches.some((t: any) => t.portfolioId === p.id) && g.totalShares && g.price != null
    )
    const value = groups.reduce((s, g) => {
      const shares = g.tranches.filter((t: any) => t.portfolioId === p.id).reduce((a: number, t: any) => a + (t.shares ?? 0), 0)
      return s + toChf(g.price! * shares, g.currency)
    }, 0)
    const invested = groups.reduce((s, g) => {
      const tranches = g.tranches.filter((t: any) => t.portfolioId === p.id && t.purchasePrice && t.shares)
      return s + tranches.reduce((a: number, t: any) => a + toChf(t.purchasePrice * t.shares, g.currency), 0)
    }, 0)
    const pnl = value - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    return { portfolio: p, value, pnl, pnlPct }
  })
)
const totalPnl = computed(() => totalStocksValue.value - totalInvested.value)
const totalPnlPct = computed(() =>
  totalInvested.value > 0 ? (totalPnl.value / totalInvested.value) * 100 : 0
)
const totalAllStocksValue = computed(() =>
  (allSymbolsData.value ?? [])
    .filter(g => g.totalShares && g.price != null)
    .reduce((s, g) => s + toChf(g.price! * g.totalShares!, g.currency), 0)
)
const totalAllCashChf = computed(() =>
  cashEntries.value.reduce((s, c) => s + toChf(c.amount, c.currency), 0)
)
const totalWealth = computed(() =>
  totalAllStocksValue.value + holdingTotalValue.value + totalAllCashChf.value + totalSaule3a.value
)

// Search
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    searchLoading.value = true
    try {
      searchResults.value = await $fetch<SearchResult[]>(`/api/stocks/search?q=${encodeURIComponent(searchQuery.value)}`)
    } catch (err) {
      searchResults.value = []
      toast.add({ title: 'Suche fehlgeschlagen', description: 'Bitte erneut versuchen.', color: 'error' })
    } finally {
      searchLoading.value = false
    }
  }, 350)
}

// Add
const addingSymbol = ref<string | null>(null)
async function addToWatchlist(result: SearchResult) {
  addingSymbol.value = result.symbol
  try {
    const { id } = await $fetch<{ id: string }>('/api/stocks/watchlist', { method: 'POST', body: { ...result, portfolioId: activePortfolioId.value } })
    await Promise.all([refresh(), refreshAllSymbols()])
    // Auto-open edit modal for the newly added tranche
    const group = watchlist.value.find(g => g.symbol === result.symbol)
    const tranche = group?.tranches.find(t => t.id === id)
    if (group && tranche) openEdit(group, tranche)
    searchResults.value = []
    searchQuery.value = ''
  } finally {
    addingSymbol.value = null
  }
}

// Remove
const removingId = ref<string | null>(null)
async function removeFromWatchlist(id: string) {
  removingId.value = id
  try {
    await $fetch(`/api/stocks/watchlist/${id}`, { method: 'DELETE' })
    await Promise.all([refresh(), refreshAllSymbols()])
  } finally {
    removingId.value = null
  }
}

// Edit modal
const editOpen = ref(false)
const editItem = ref<WatchlistGroup | null>(null)
const editTrancheId = ref<string | null>(null)
const editLoading = ref(false)
const priceLoading = ref(false)
const editForm = reactive({ shares: '', purchasePrice: '', purchaseDate: '', portfolioId: 'none' })

function openEdit(group: WatchlistGroup, tranche: WatchlistTranche) {
  editItem.value = group
  editTrancheId.value = tranche.id
  editForm.shares = tranche.shares?.toString() ?? ''
  editForm.purchasePrice = tranche.purchasePrice?.toString() ?? ''
  editForm.purchaseDate = tranche.purchaseDate ?? ''
  editForm.portfolioId = tranche.portfolioId ?? 'none'
  editOpen.value = true
}

async function fetchPriceAtDate() {
  if (!editItem.value || !editForm.purchaseDate) return
  priceLoading.value = true
  editForm.purchasePrice = ''
  try {
    const res = await $fetch<{ price: number | null }>(`/api/stocks/price-at?symbol=${encodeURIComponent(editItem.value.symbol)}&date=${editForm.purchaseDate}`)
    if (res.price != null) {
      editForm.purchasePrice = res.price.toFixed(2)
    }
  } catch {
    // leave empty, user can enter manually
  } finally {
    priceLoading.value = false
  }
}

const previewPnl = computed(() => {
  if (!editItem.value?.price || !editForm.shares || !editForm.purchasePrice) return 0
  return (editItem.value.price - Number(editForm.purchasePrice)) * Number(editForm.shares)
})
const previewPnlPct = computed(() => {
  if (!editForm.purchasePrice || Number(editForm.purchasePrice) === 0) return 0
  return ((editItem.value!.price! - Number(editForm.purchasePrice)) / Number(editForm.purchasePrice)) * 100
})

async function saveEdit() {
  if (!editTrancheId.value) return
  editLoading.value = true
  try {
    await $fetch(`/api/stocks/watchlist/${editTrancheId.value}`, {
      method: 'PATCH',
      body: {
        shares: editForm.shares ? Number(editForm.shares) : null,
        purchasePrice: editForm.purchasePrice ? Number(editForm.purchasePrice) : null,
        purchaseDate: editForm.purchaseDate || null,
        portfolioId: editForm.portfolioId === 'none' ? null : editForm.portfolioId,
      },
    })
    await Promise.all([refresh(), refreshAllSymbols()])
    editOpen.value = false
  } finally {
    editLoading.value = false
  }
}

// Säule 3A
interface Saule3aEntry {
  id: string
  label: string
  amount: number
}

const { data: saule3aData, refresh: refreshSaule3a } = await useFetch<Saule3aEntry[]>('/api/saule3a', { headers })
const saule3aEntries = computed(() => saule3aData.value ?? [])
const totalSaule3a = computed(() => saule3aEntries.value.reduce((s, e) => s + e.amount, 0))

const editingSaule3aId = ref<string | null>(null)
const saule3aEditForm = reactive({ label: '', amount: '' })
const showAddSaule3aRow = ref(false)
const newSaule3aForm = reactive({ label: '', amount: '' })
const savingSaule3a = ref(false)
const deletingSaule3aId = ref<string | null>(null)

function startSaule3aEdit(entry: Saule3aEntry) {
  editingSaule3aId.value = entry.id
  saule3aEditForm.label = entry.label
  saule3aEditForm.amount = String(entry.amount)
}

async function saveSaule3aEdit(id: string) {
  if (!saule3aEditForm.amount) return
  await $fetch(`/api/saule3a/${id}`, {
    method: 'PATCH',
    body: { label: saule3aEditForm.label, amount: Number(saule3aEditForm.amount) },
  })
  editingSaule3aId.value = null
  await refreshSaule3a()
}

async function addSaule3aEntry() {
  if (!newSaule3aForm.amount) return
  savingSaule3a.value = true
  try {
    await $fetch('/api/saule3a', {
      method: 'POST',
      body: { label: newSaule3aForm.label, amount: Number(newSaule3aForm.amount) },
    })
    showAddSaule3aRow.value = false
    Object.assign(newSaule3aForm, { label: '', amount: '' })
    await refreshSaule3a()
  } finally {
    savingSaule3a.value = false
  }
}

async function deleteSaule3aEntry(id: string) {
  deletingSaule3aId.value = id
  try {
    await $fetch(`/api/saule3a/${id}`, { method: 'DELETE' })
    await refreshSaule3a()
  } finally {
    deletingSaule3aId.value = null
  }
}

// Cash balances
interface CashEntry {
  id: string
  label: string
  amount: number
  currency: string
  portfolioId: string | null
}

const { data: cashData, refresh: refreshCash } = await useFetch<CashEntry[]>('/api/cash', { headers })
const cashEntries = computed(() => cashData.value ?? [])

const filteredCashEntries = computed(() =>
  activePortfolioId.value === null
    ? cashEntries.value
    : cashEntries.value.filter(c => c.portfolioId === activePortfolioId.value)
)

const totalCashChf = computed(() =>
  filteredCashEntries.value.reduce((s, c) => s + toChf(c.amount, c.currency), 0)
)

const cashQuotePct = computed(() =>
  totalValue.value > 0 ? (totalCashChf.value / totalValue.value) * 100 : 0
)

// Inline editing
const editingCashId = ref<string | null>(null)
const inlineEditForm = reactive({ amount: '', currency: 'CHF', label: '' })
const showAddCashRow = ref(false)
const newCashForm = reactive({ amount: '', currency: 'CHF', label: '' })
const savingCash = ref(false)
const deletingCashId = ref<string | null>(null)

function startEditCash(c: CashEntry) {
  editingCashId.value = c.id
  inlineEditForm.amount = String(c.amount)
  inlineEditForm.currency = c.currency
  inlineEditForm.label = c.label ?? ''
}

async function saveInlineCash(id: string) {
  if (!inlineEditForm.amount) return
  await $fetch(`/api/cash/${id}`, {
    method: 'PATCH',
    body: {
      amount: Number(inlineEditForm.amount),
      currency: inlineEditForm.currency,
      label: inlineEditForm.label,
      portfolioId: filteredCashEntries.value.find(c => c.id === id)?.portfolioId ?? null,
    },
  })
  editingCashId.value = null
  await refreshCash()
}

async function addCashEntry() {
  if (!newCashForm.amount) return
  savingCash.value = true
  try {
    await $fetch('/api/cash', {
      method: 'POST',
      body: {
        amount: Number(newCashForm.amount),
        currency: newCashForm.currency,
        label: newCashForm.label,
        portfolioId: activePortfolioId.value,
      },
    })
    showAddCashRow.value = false
    Object.assign(newCashForm, { amount: '', currency: 'CHF', label: '' })
    await refreshCash()
  } finally {
    savingCash.value = false
  }
}

async function deleteCash(id: string) {
  deletingCashId.value = id
  try {
    await $fetch(`/api/cash/${id}`, { method: 'DELETE' })
    await refreshCash()
  } finally {
    deletingCashId.value = null
  }
}

</script>
