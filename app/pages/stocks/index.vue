<template>
  <div class="p-6">
    <div class="max-w-screen-xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <div>
          <h1 class="text-2xl font-bold">Aktien Watchlist</h1>
          <p class="text-sm text-gray-500 mt-0.5">Suche und verfolge deine Aktien</p>
        </div>
      </div>

      <!-- Portfolio tabs -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="activePortfolioId === null
            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          @click="activePortfolioId = null"
        >
          Alle
        </button>
        <button
          v-for="p in portfolios"
          :key="p.id"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
          :class="activePortfolioId === p.id
            ? 'text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          :style="activePortfolioId === p.id ? { backgroundColor: colorHex(p.color) } : {}"
          @click="activePortfolioId = p.id; sortByPortfolio = false"
        >
          <UIcon name="i-lucide-folder" class="text-xs shrink-0" :style="activePortfolioId !== p.id ? { color: colorHex(p.color) } : {}" />
          {{ p.name }}
          <span class="text-xs opacity-60">{{ p.stockCount + p.metalCount }}</span>
        </button>
      </div>

      <!-- Sort control (only in Alle) -->
      <div v-if="!activePortfolioId && portfolios.length" class="flex items-center gap-2">
        <span class="text-xs text-gray-500">Sortieren:</span>
        <div class="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          <button
            class="px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            :class="!sortByPortfolio ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'"
            @click="sortByPortfolio = false"
          >
            <UIcon name="i-lucide-clock" class="text-xs" />
            Datum
          </button>
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <button
            class="px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            :class="sortByPortfolio ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'"
            @click="sortByPortfolio = true"
          >
            <UIcon name="i-lucide-folder" class="text-xs" />
            Portfolio
          </button>
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
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-package" class="text-yellow-600" />
              <h2 class="font-semibold">Meine Edelmetalle</h2>
            </div>
            <div class="flex items-center gap-2">
              <USelect v-model="holdingCurrency" :items="currencyOptions" size="sm" class="w-28" />
              <UButton icon="i-lucide-plus" size="sm" @click="addHoldingOpen = true">Hinzufügen</UButton>
            </div>
          </div>
        </template>

        <div v-if="holdingsPending && !filteredHoldings.length" class="py-6 flex justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
        </div>

        <p v-else-if="!filteredHoldings.length" class="text-sm text-gray-500 py-4 text-center">
          {{ activePortfolioId ? 'Keine Edelmetalle in diesem Portfolio.' : 'Noch keine Edelmetalle erfasst.' }}
        </p>

        <template v-else-if="filteredHoldings.length">
          <!-- Column headers -->
          <div class="flex items-center gap-4 px-1 mb-1">
            <button class="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-1 min-w-0" @click="toggleHoldingSort('metal')">
              Metall / Art
              <UIcon :name="holdingSortKey === 'metal' ? (holdingSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3 shrink-0" :class="holdingSortKey === 'metal' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
            <button class="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors w-24" @click="toggleHoldingSort('date')">
              Kaufdatum
              <UIcon :name="holdingSortKey === 'date' ? (holdingSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3 shrink-0" :class="holdingSortKey === 'date' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
            <div class="w-32 shrink-0" />
            <button class="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors w-28" @click="toggleHoldingSort('value')">
              Aktueller Wert
              <UIcon :name="holdingSortKey === 'value' ? (holdingSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3 shrink-0" :class="holdingSortKey === 'value' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
            <div class="w-16 shrink-0" />
          </div>

          <!-- Holdings list (grouped) -->
          <div class="space-y-2">
            <template v-for="group in groupedHoldings" :key="group.metalKey + '|' + group.coinType">

              <!-- ── Single item: render as normal row ── -->
              <div v-if="group.items.length === 1" class="py-3 flex items-center gap-4">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span class="text-xl shrink-0">{{ metalIcon(group.items[0].metalKey) }}</span>
                  <div class="min-w-0">
                    <p class="font-medium text-sm flex items-center gap-2 flex-wrap">
                      {{ metalName(group.items[0].metalKey) }}
                      <span v-if="group.items[0].coinType" class="text-gray-500 font-normal">· {{ group.items[0].coinType }}</span>
                      <span
                        v-if="!activePortfolioId && portfolioById(group.items[0].portfolioId)"
                        class="inline-flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-full"
                        :style="{ backgroundColor: colorHex(portfolioById(group.items[0].portfolioId)!.color) + '22', color: colorHex(portfolioById(group.items[0].portfolioId)!.color) }"
                      >
                        <span class="w-1.5 h-1.5 rounded-full inline-block" :style="{ backgroundColor: colorHex(portfolioById(group.items[0].portfolioId)!.color) }"></span>
                        {{ portfolioById(group.items[0].portfolioId)!.name }}
                      </span>
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

              <!-- ── Multiple items: grouped card ── -->
              <div v-else class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Group header -->
                <div class="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60">
                  <span class="text-lg shrink-0">{{ metalIcon(group.metalKey) }}</span>
                  <span class="font-semibold text-sm">{{ metalName(group.metalKey) }}</span>
                  <span v-if="group.coinType" class="text-sm text-gray-500 font-normal">· {{ group.coinType }}</span>
                  <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 font-medium">{{ group.items.length }}×</span>
                  <div class="flex-1" />
                  <span class="text-sm font-bold">
                    {{ fmtMetal(group.items.reduce((s: number, h: any) => s + (h.currentTotal ?? 0), 0)) }} {{ holdingCurrency }}
                  </span>
                </div>

                <!-- Individual rows -->
                <div class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="h in group.items" :key="h.id" class="py-2.5 px-4 flex items-center gap-4">
                    <!-- Metall / Art: nur Menge + Portfolio-Badge -->
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <div class="w-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                      <div class="min-w-0">
                        <p class="text-sm text-gray-700 dark:text-gray-300">{{ h.quantity }} {{ h.unit }}</p>
                        <span
                          v-if="!activePortfolioId && portfolioById(h.portfolioId)"
                          class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                          :style="{ backgroundColor: colorHex(portfolioById(h.portfolioId)!.color) + '22', color: colorHex(portfolioById(h.portfolioId)!.color) }"
                        >
                          <span class="w-1.5 h-1.5 rounded-full inline-block" :style="{ backgroundColor: colorHex(portfolioById(h.portfolioId)!.color) }"></span>
                          {{ portfolioById(h.portfolioId)!.name }}
                        </span>
                      </div>
                    </div>
                    <!-- Kaufdatum -->
                    <div class="w-24 text-right shrink-0">
                      <p class="text-sm text-gray-500">{{ h.purchaseDate ?? '—' }}</p>
                    </div>
                    <!-- Kaufpreis -->
                    <div class="w-32 shrink-0 text-right">
                      <div v-if="h.purchasePricePerOz != null" class="inline-block border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ fmtMetal(priceFromPerOz(h.purchasePricePerOz, h.unit)) }} {{ h.purchaseCurrency }}<span class="text-xs font-normal text-gray-400">/{{ h.unit }}</span></p>
                      </div>
                    </div>
                    <!-- Aktueller Wert -->
                    <div class="w-28 text-right shrink-0">
                      <p class="font-semibold text-sm">{{ h.currentTotal != null ? fmtMetal(h.currentTotal) : '—' }} {{ holdingCurrency }}</p>
                      <p v-if="h.pnl != null" class="text-xs" :class="h.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                        {{ h.pnl >= 0 ? '+' : '' }}{{ fmtMetal(h.pnl) }} ({{ h.pnlPct?.toFixed(2) }}%)
                      </p>
                    </div>
                    <!-- Actions -->
                    <div class="w-16 flex items-center justify-end gap-1 shrink-0">
                      <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEditHolding(h)" />
                      <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingHoldingId === h.id" @click="removeHolding(h.id)" />
                    </div>
                  </div>
                </div>
              </div>

            </template>
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
              <button
                v-for="u in ['oz', 'g', 'kg']"
                :key="u"
                class="px-2.5 py-1 transition-colors"
                :class="summaryUnit === u ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="summaryUnit = u"
              >{{ u }}</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="m in holdingMetalSummary"
              :key="m.metalKey"
              type="button"
              class="rounded-lg p-3 flex items-center gap-3 transition-all text-left border-2"
              :class="activeMetalFilter === m.metalKey
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'"
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
              :icon="isInWatchlist(result.symbol) ? 'i-lucide-check' : 'i-lucide-plus'"
              :color="isInWatchlist(result.symbol) ? 'success' : 'primary'"
              :variant="isInWatchlist(result.symbol) ? 'subtle' : 'solid'"
              :disabled="isInWatchlist(result.symbol)"
              :loading="addingSymbol === result.symbol"
              class="ml-3 shrink-0"
              @click="addToWatchlist(result)"
            >
              {{ isInWatchlist(result.symbol) ? 'Gespeichert' : 'Hinzufügen' }}
            </UButton>
          </div>
        </div>
        <p v-else-if="searchQuery && !searchLoading" class="mt-3 text-sm text-gray-500">
          Keine Ergebnisse für „{{ searchQuery }}"
        </p>
      </UCard>

      <!-- Portfolio summary -->
      <div v-if="aktienportfolios.length > 0" class="flex items-center gap-2 flex-wrap">
        <button
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="activePortfolioId === null
            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          @click="activePortfolioId = null; sortByPortfolio = false"
        >
          Alle
        </button>
        <button
          v-for="p in aktienportfolios"
          :key="p.id"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
          :class="activePortfolioId === p.id
            ? 'text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          :style="activePortfolioId === p.id ? { backgroundColor: colorHex(p.color) } : {}"
          @click="activePortfolioId = p.id; sortByPortfolio = false"
        >
          <UIcon name="i-lucide-folder" class="text-xs shrink-0" :style="activePortfolioId !== p.id ? { color: colorHex(p.color) } : {}" />
          {{ p.name }}
        </button>
      </div>
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

      <!-- Erwartete Dividenden -->
      <UCard>
        <template #header>
          <button class="w-full flex items-center justify-between" @click="dividendenOpen = !dividendenOpen">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coins" class="text-yellow-500" />
              <div class="text-left">
                <h2 class="font-semibold">Erwartete Dividendenausschüttung {{ currentYear }}</h2>
                <p class="text-xs text-gray-400">Basiert auf der letzten Jahresdividende</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="totalDividendChf > 0 && !dividendenOpen" class="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {{ fmt(totalDividendChf) }} CHF
              </span>
              <UButton v-if="dividendenOpen" variant="ghost" color="neutral" icon="i-lucide-refresh-cw" size="sm" :loading="dividendsPending" @click.stop="refreshDividends()" />
              <UIcon :name="dividendenOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="text-gray-400" />
            </div>
          </button>
        </template>

        <div v-if="dividendenOpen">
          <div v-if="dividendsPending && !dividends.length" class="py-6 flex justify-center">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
          </div>
          <div v-else-if="!dividends.length" class="text-sm text-gray-400 py-4 text-center">
            Keine Dividenden-Daten für aktuelle Positionen gefunden.
          </div>
          <div v-else>
            <!-- Table header -->
            <div class="grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-medium text-gray-400">
              <div class="col-span-3">Symbol</div>
              <div class="col-span-4 text-right">Div/Aktie</div>
              <div class="col-span-2 text-right">Stück</div>
              <div class="col-span-3 text-right">Erwartet</div>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div v-for="d in dividends" :key="d.id" class="grid grid-cols-12 gap-2 py-2.5 px-1 items-center">
                <div class="col-span-3 min-w-0">
                  <p class="font-medium text-sm">{{ d.symbol }}</p>
                  <p v-if="d.exDividendDate" class="text-xs text-gray-400">Ex: {{ d.exDividendDate }}</p>
                </div>
                <div class="col-span-4 text-right">
                  <p class="text-sm">{{ d.dividendRate!.toFixed(2) }} {{ d.currency }}</p>
                </div>
                <div class="col-span-2 text-right text-sm text-gray-500">
                  {{ d.shares }}
                </div>
                <div class="col-span-3 text-right">
                  <p class="font-semibold text-sm">{{ fmt(toChf(d.annualDividend!, d.currency)) }} CHF</p>
                </div>
              </div>
            </div>
            <!-- Total -->
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <p class="text-xs text-gray-400">Total erwartet {{ currentYear }}</p>
              <div class="text-right">
                <p class="font-bold">{{ fmt(totalDividendChf) }} CHF</p>
                <p class="text-xs text-gray-400">≈ {{ fmt(totalDividendChf / 12) }} CHF / Monat</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Cashquote -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-banknote" class="text-green-500" />
              <h2 class="font-semibold">Cashquote</h2>
            </div>
            <p v-if="totalValue > 0 && totalCashChf > 0" class="text-sm font-bold text-green-600 dark:text-green-400">{{ cashQuotePct.toFixed(1) }}%</p>
          </div>
        </template>

        <div class="space-y-1">
          <!-- Existing entries -->
          <div v-for="c in filteredCashEntries" :key="c.id">
            <!-- Edit mode -->
            <div v-if="editingCashId === c.id" class="flex items-center gap-2 py-1">
              <UInput v-model="inlineEditForm.amount" type="number" step="0.01" class="flex-1" autofocus @keydown.enter.prevent="saveInlineCash(c.id)" @keydown.escape="editingCashId = null" />
              <USelect v-model="inlineEditForm.currency" :items="currencyOptions" class="w-28" />
              <UButton size="sm" icon="i-lucide-check" @click="saveInlineCash(c.id)" />
              <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-x" @click="editingCashId = null" />
            </div>
            <!-- View mode -->
            <div v-else class="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group cursor-pointer" @click="startEditCash(c)">
              <div class="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium shrink-0">{{ fmt(c.amount) }} {{ c.currency }}</span>
                <span
                  v-if="activePortfolioId === null && portfolioById(c.portfolioId)"
                  class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full shrink-0"
                  :style="{ backgroundColor: colorHex(portfolioById(c.portfolioId)!.color) + '22', color: colorHex(portfolioById(c.portfolioId)!.color) }"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: colorHex(portfolioById(c.portfolioId)!.color) }"></span>
                  {{ portfolioById(c.portfolioId)!.name }}
                </span>
              </div>
              <span v-if="totalValue > 0" class="text-xs text-gray-400 shrink-0">{{ (toChf(c.amount, c.currency) / totalValue * 100).toFixed(1) }}%</span>
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="xs" class="opacity-0 group-hover:opacity-100" :loading="deletingCashId === c.id" @click.stop="deleteCash(c.id)" />
            </div>
          </div>

          <!-- Add row -->
          <div v-if="showAddCashRow" class="flex items-center gap-2 py-1 mt-1">
            <UInput v-model="newCashForm.amount" type="number" step="0.01" placeholder="Betrag" class="flex-1" autofocus @keydown.enter.prevent="addCashEntry" @keydown.escape="showAddCashRow = false" />
            <USelect v-model="newCashForm.currency" :items="currencyOptions" class="w-28" />
            <UButton size="sm" icon="i-lucide-check" :loading="savingCash" @click="addCashEntry" />
            <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-x" @click="showAddCashRow = false" />
          </div>
        </div>

        <!-- Footer: total + add button -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <span v-if="filteredCashEntries.length" class="text-sm font-bold">{{ fmt(totalCashChf) }} CHF</span>
            <span v-else class="text-sm text-gray-400">Noch keine Einträge</span>
          </div>
          <UButton v-if="!showAddCashRow" size="sm" variant="ghost" color="neutral" icon="i-lucide-plus" @click="showAddCashRow = true; newCashForm.amount = ''; newCashForm.label = ''; newCashForm.currency = 'CHF'">
            Hinzufügen
          </UButton>
        </div>
      </UCard>

      <!-- Watchlist table -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">Meine Watchlist</h2>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-refresh-cw"
              size="sm"
              :loading="watchlistPending"
              @click="refresh()"
            />
          </div>
        </template>

        <div v-if="watchlistPending && !watchlist.length" class="py-8 flex justify-center">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 text-2xl" />
        </div>

        <p v-else-if="!filteredWatchlist.length" class="text-sm text-gray-500 py-6 text-center">
          {{ activePortfolioId ? 'Keine Aktien in diesem Portfolio. Suche oben nach einer Aktie.' : 'Noch keine Aktien in deiner Watchlist. Suche oben nach einer Aktie.' }}
        </p>

        <UTable v-else :key="sortByPortfolio ? 'sorted' : 'default'" :data="filteredWatchlist" :columns="columns">
          <template #symbol-cell="{ row }">
            <div class="flex items-center gap-2">
              <span
                class="font-medium cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                @click="navigateTo(`/stocks/${row.original.symbol}`)"
              >{{ row.original.symbol }}</span>
              <span
                v-if="!activePortfolioId && portfolioById(row.original.portfolioId)"
                class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
                :style="{ backgroundColor: colorHex(portfolioById(row.original.portfolioId).color) + '22', color: colorHex(portfolioById(row.original.portfolioId).color) }"
              >
                <span class="w-1.5 h-1.5 rounded-full inline-block shrink-0" :style="{ backgroundColor: colorHex(portfolioById(row.original.portfolioId).color) }"></span>
                {{ portfolioById(row.original.portfolioId).name }}
              </span>
            </div>
          </template>

          <template #price-cell="{ row }">
            <span
              v-if="row.original.price != null"
              :class="(row.original.changePercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'"
            >
              {{ row.original.price.toFixed(2) }} {{ row.original.currency }}
            </span>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #changePercent-cell="{ row }">
            <span
              v-if="row.original.changePercent != null"
              :class="row.original.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'"
            >
              {{ row.original.changePercent >= 0 ? '+' : '' }}{{ row.original.changePercent.toFixed(2) }}%
            </span>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #pnl-cell="{ row }">
            <template v-if="row.original.shares && row.original.purchasePrice && row.original.price != null">
              <div>
                <p :class="pnl(row.original) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="font-medium">
                  {{ pnl(row.original) >= 0 ? '+' : '' }}{{ fmt(pnl(row.original)) }}
                </p>
                <p class="text-xs" :class="pnlPct(row.original) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                  {{ pnlPct(row.original) >= 0 ? '+' : '' }}{{ pnlPct(row.original).toFixed(2) }}%
                </p>
              </div>
            </template>
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>

          <template #tagPnl-header>
            <button class="flex items-center gap-1 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('tagPnl')">
              Tag G/V
              <UIcon :name="watchlistSortKey === 'tagPnl' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'tagPnl' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
          </template>
          <template #tagPnl-cell="{ row }">
            <template v-if="row.original.shares && row.original.changePercent != null && row.original.price != null">
              <span class="font-medium text-sm" :class="tagPnl(row.original) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                {{ tagPnl(row.original) >= 0 ? '+' : '' }}{{ fmt(tagPnl(row.original)) }}
              </span>
            </template>
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>

          <template #marktwert-header>
            <button class="flex items-center gap-1 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('marktwert')">
              Marktwert
              <UIcon :name="watchlistSortKey === 'marktwert' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'marktwert' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
          </template>
          <template #marktwert-cell="{ row }">
            <span v-if="row.original.shares && row.original.price != null" class="font-semibold text-sm">
              {{ fmt(row.original.shares * row.original.price) }} {{ row.original.currency }}
            </span>
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>

          <template #shares-header>
            <button class="flex items-center gap-1 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors" @click="toggleWatchlistSort('shares')">
              Stück
              <UIcon :name="watchlistSortKey === 'shares' ? (watchlistSortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down'" class="w-3 h-3" :class="watchlistSortKey === 'shares' ? 'text-primary-500' : 'text-gray-300'" />
            </button>
          </template>
          <template #shares-cell="{ row }">
            <span v-if="row.original.shares">{{ row.original.shares }} Stk.</span>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" @click="openEdit(row.original)" />
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" :loading="removingId === row.original.id" @click="removeFromWatchlist(row.original.id)" />
            </div>
          </template>
        </UTable>
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
          <DatePicker v-model="holdingForm.purchaseDate" @select="fetchMetalPriceAtDate" />
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
        <UFormField label="Portfolio">
          <USelect
            v-model="editHoldingForm.portfolioId"
            :items="[{ label: 'Kein Portfolio', value: 'none' }, ...portfolios.map(p => ({ label: p.name, value: p.id }))]"
          />
        </UFormField>
        <UFormField label="Kaufdatum">
          <DatePicker v-model="editHoldingForm.purchaseDate" @select="fetchEditMetalPriceAtDate" />
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

interface WatchlistItem {
  id: string
  symbol: string
  name: string
  exchange: string
  currency: string
  price: number | null
  changePercent: number | null
  shares: number | null
  purchasePrice: number | null
  purchaseDate: string | null
  portfolioId: string | null
}

const headers = useRequestHeaders(['cookie'])

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
const sortByPortfolio = ref(false)

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
  const items = goldchPrices.value
  const sections: { name: string; items: any[] }[] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (!seen.has(item.section)) {
      seen.add(item.section)
      sections.push({ name: item.section, items: [] })
    }
    sections.find(s => s.name === item.section)!.items.push(item)
  }
  return sections
})

// Edelmetall-Portfolio
const holdingCurrency = ref('CHF')

const { data: holdingsData, pending: holdingsPending, refresh: refreshHoldings } = await useFetch(
  () => {
    const params = new URLSearchParams({ currency: holdingCurrency.value })
    if (activePortfolioId.value) params.set('portfolioId', activePortfolioId.value)
    return `/api/metals/holdings?${params}`
  },
  { headers, watch: [holdingCurrency, activePortfolioId] }
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
  } else if (sortByPortfolio.value) {
    arr.sort((a, b) => {
      const pa = portfolioById(a.portfolioId)?.name ?? '\uFFFF'
      const pb = portfolioById(b.portfolioId)?.name ?? '\uFFFF'
      return pa.localeCompare(pb)
    })
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

async function fetchMetalPriceAtDate() {
  if (!holdingForm.metalKey || !holdingForm.purchaseDate) return
  holdingPriceLoading.value = true
  holdingForm.purchasePricePerOz = ''
  try {
    const res = await $fetch<{ price: number | null }>(`/api/metals/price-at?metalKey=${holdingForm.metalKey}&date=${holdingForm.purchaseDate}&currency=${holdingForm.purchaseCurrency}`)
    if (res.price != null) holdingForm.purchasePricePerOz = priceFromPerOz(res.price, holdingForm.unit).toFixed(4)
  } catch { /* ignore */ } finally {
    holdingPriceLoading.value = false
  }
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
        portfolioId: activePortfolioId.value,
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
  portfolioId: 'none',
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
  editHoldingForm.portfolioId = h.portfolioId ?? 'none'
  editHoldingOpen.value = true
}

async function fetchEditMetalPriceAtDate() {
  if (!editHoldingForm.metalKey || !editHoldingForm.purchaseDate) return
  editHoldingPriceLoading.value = true
  editHoldingForm.purchasePricePerOz = ''
  try {
    const res = await $fetch<{ price: number | null }>(`/api/metals/price-at?metalKey=${editHoldingForm.metalKey}&date=${editHoldingForm.purchaseDate}&currency=${editHoldingForm.purchaseCurrency}`)
    if (res.price != null) editHoldingForm.purchasePricePerOz = priceFromPerOz(res.price, editHoldingForm.unit).toFixed(4)
  } catch { /* ignore */ } finally {
    editHoldingPriceLoading.value = false
  }
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
        portfolioId: editHoldingForm.portfolioId === 'none' ? null : editHoldingForm.portfolioId,
      },
    })
    await refreshHoldings()
    editHoldingOpen.value = false
  } finally {
    editHoldingLoading.value = false
  }
}

// All symbols (for isInWatchlist check across all portfolios)
const { data: allSymbolsData, refresh: refreshAllSymbols } = await useFetch<WatchlistItem[]>(
  '/api/stocks/watchlist', { headers }
)
const allSymbols = computed(() => new Set((allSymbolsData.value ?? []).map(w => w.symbol)))
const isInWatchlist = (symbol: string) => allSymbols.value.has(symbol)

// Watchlist filtered server-side by active portfolio
const { data: watchlistData, pending: watchlistPending, refresh } = await useFetch<WatchlistItem[]>(
  () => activePortfolioId.value
    ? `/api/stocks/watchlist?portfolioId=${activePortfolioId.value}`
    : '/api/stocks/watchlist',
  { headers, watch: [activePortfolioId] }
)
const watchlist = computed(() => watchlistData.value ?? [])
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
      const pa = portfolioById(a.portfolioId)?.name ?? '\uFFFF'
      const pb = portfolioById(b.portfolioId)?.name ?? '\uFFFF'
      return pa.localeCompare(pb)
    })
  }
  if (watchlistSortKey.value) {
    const dir = watchlistSortDir.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (watchlistSortKey.value === 'shares') return ((a.shares ?? 0) - (b.shares ?? 0)) * dir
      if (watchlistSortKey.value === 'pnl') return (pnl(a as any) - pnl(b as any)) * dir
      if (watchlistSortKey.value === 'tagPnl') return (tagPnl(a) - tagPnl(b)) * dir
      if (watchlistSortKey.value === 'marktwert') return (((a.shares ?? 0) * (a.price ?? 0)) - ((b.shares ?? 0) * (b.price ?? 0))) * dir
      return 0
    })
  }
  return arr
})

// P&L helpers
const pnl = (item: WatchlistItem) =>
  (item.price! - item.purchasePrice!) * item.shares!

const pnlPct = (item: WatchlistItem) =>
  ((item.price! - item.purchasePrice!) / item.purchasePrice!) * 100

// Daily P&L: shares × (price × changePercent/100)
function tagPnl(item: WatchlistItem): number {
  if (!item.shares || item.changePercent == null || item.price == null) return 0
  const dailyChange = item.price * (item.changePercent / 100) / (1 + item.changePercent / 100)
  return item.shares * dailyChange
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

// Portfolio summary (only items with full position data and live price)
const portfolioItems = computed(() =>
  watchlist.value.filter(w => w.shares && w.purchasePrice && w.price != null)
)
const totalInvested = computed(() =>
  portfolioItems.value.reduce((s, w) => s + toChf(w.purchasePrice! * w.shares!, w.currency), 0)
)
const totalStocksValue = computed(() =>
  portfolioItems.value.reduce((s, w) => s + toChf(w.price! * w.shares!, w.currency), 0)
)
const totalValue = computed(() => totalStocksValue.value + totalCashChf.value)
const totalPnl = computed(() => totalStocksValue.value - totalInvested.value)
const totalPnlPct = computed(() =>
  totalInvested.value > 0 ? (totalPnl.value / totalInvested.value) * 100 : 0
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
    } catch {
      searchResults.value = []
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
    await $fetch('/api/stocks/watchlist', { method: 'POST', body: { ...result, portfolioId: activePortfolioId.value } })
    await Promise.all([refresh(), refreshAllSymbols()])
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
const editItem = ref<WatchlistItem | null>(null)
const editLoading = ref(false)
const priceLoading = ref(false)
const editForm = reactive({ shares: '', purchasePrice: '', purchaseDate: '', portfolioId: 'none' })

function openEdit(item: WatchlistItem) {
  editItem.value = item
  editForm.shares = item.shares?.toString() ?? ''
  editForm.purchasePrice = item.purchasePrice?.toString() ?? ''
  editForm.purchaseDate = item.purchaseDate ?? ''
  editForm.portfolioId = item.portfolioId ?? 'none'
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
  if (!editItem.value) return
  editLoading.value = true
  try {
    await $fetch(`/api/stocks/watchlist/${editItem.value.id}`, {
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

// Table columns
const columns = [
  { id: 'symbol', accessorKey: 'symbol', header: 'Symbol' },
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'price', accessorKey: 'price', header: 'Kurs' },
  { id: 'changePercent', accessorKey: 'changePercent', header: 'Tag %' },
  { id: 'tagPnl', header: 'Tag G/V' },
  { id: 'shares', accessorKey: 'shares', header: 'Stück' },
  { id: 'marktwert', header: 'Marktwert' },
  { id: 'pnl', header: 'Gewinn / Verlust' },
  { id: 'actions', header: '' },
]
</script>
