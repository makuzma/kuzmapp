<template>
  <div class="finance-page p-6 min-h-screen">
    <div class="max-w-screen-2xl mx-auto space-y-10">

      <h1 class="text-5xl italic font-instrument">Finance</h1>

      <!-- Grosse rote Pill-Card -->
      <div class="pill-card">
        <!-- Zeitraum-Selektor oben rechts als Pille -->
        <div class="pill-header">
          <div class="pill-period-wrap" :class="{ 'pill-period-expanded': pillExpanded }" @click="pillExpanded = !pillExpanded" style="cursor:pointer">
            <div class="period-options" :class="{ 'period-options-visible': pillExpanded }">
              <button
                v-for="p in periods"
                :key="p"
                class="period-btn font-[SUSE_Mono]"
                :class="selectedPeriod === p ? 'period-btn-active' : ''"
                @click.stop="selectedPeriod = p; pillExpanded = false"
              >{{ p }}</button>
            </div>
            <span v-if="!pillExpanded" class="period-active-label font-[SUSE_Mono]">{{ selectedPeriod }}</span>
            <div class="pill-circle" :key="glowKey" :class="currentPeriodData.pct >= 0 ? 'pill-circle-up' : 'pill-circle-down'">
              <UIcon
                :name="currentPeriodData.pct >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                class="pill-circle-icon"
                :class="currentPeriodData.pct >= 0 ? 'text-green-500' : 'text-red-700'"
              />
            </div>
          </div>
        </div>
        <!-- Mini-Cards + Totals -->
        <div class="pill-body">
          <div class="pill-cards-row">
            <template v-if="summaryPending">
              <USkeleton v-for="n in 3" :key="n" class="pill-skeleton-mini" />
            </template>
            <template v-else>
              <FinanceMiniCard
                v-for="card in miniCards"
                :key="card.label"
                v-bind="card"
                :shadow="miniCardShadow"
              />
            </template>
          </div>
          <div class="pill-right">
            <template v-if="summaryPending">
              <USkeleton class="pill-skeleton-change" />
              <USkeleton class="pill-skeleton-total" />
            </template>
            <template v-else>
              <div class="pill-change font-[SUSE_Mono]" :class="currentPeriodData.pct >= 0 ? 'text-green-400' : 'text-red-200'">
                {{ currentPeriodData.pct >= 0 ? '+' : '' }}{{ currentPeriodData.pct.toFixed(1) }}%
                &nbsp;{{ currentPeriodData.chf >= 0 ? '+' : '' }}{{ Math.abs(currentPeriodData.chf).toLocaleString('de-CH') }} CHF
              </div>
              <div class="pill-total font-[SUSE_Mono]" style="color: #c8ff57"><FlipNumber :value="totalValue.toLocaleString('de-CH')" /> {{ companyCurrency }}</div>
            </template>
          </div>
        </div>
      </div>

      <!-- AKTIEN -->
      <section class="space-y-3">
        <h2 class="text-[1.925rem] italic font-instrument">Aktien</h2>
        <div class="aktien-grid">

          <!-- Spalte 1-2: Aktien-Positionen -->
          <div class="placeholder-card stock-positions-card" style="grid-column: span 2">
            <div class="stock-pos-header">
              <button class="stock-sort-btn stock-sort-btn--left" :class="stockSortKey === 'symbol' ? 'stock-sort-btn-active' : ''" @click="toggleSort('symbol')">
                Positionen
                <UIcon v-if="stockSortKey === 'symbol'" :name="stockSortDir === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <button class="stock-sort-btn stock-sort-btn--right" :class="stockSortKey === 'value' ? 'stock-sort-btn-active' : ''" @click="toggleSort('value')">
                Wert
                <UIcon v-if="stockSortKey === 'value'" :name="stockSortDir === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <button class="stock-sort-btn stock-sort-btn--right" :class="stockSortKey === 'pnl' ? 'stock-sort-btn-active' : ''" @click="toggleSort('pnl')">
                G&amp;V
                <UIcon v-if="stockSortKey === 'pnl'" :name="stockSortDir === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <button class="stock-sort-btn stock-sort-btn--right" :class="stockSortKey === 'change' ? 'stock-sort-btn-active' : ''" @click="toggleSort('change')">
                %
                <UIcon v-if="stockSortKey === 'change'" :name="stockSortDir === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <div class="stock-header-plus">
                <UButton variant="ghost" color="neutral" icon="i-lucide-plus" size="xs" @click="addStockOpen = true" />
              </div>
            </div>
            <div v-if="watchlistPending" class="card-skeleton-wrap">
              <USkeleton v-for="n in 5" :key="n" class="row-skeleton" />
            </div>
            <template v-else>
            <OverlayScrollbarsComponent :options="osOptions" class="stock-pos-scroll" defer>
            <div class="stock-pos-list">
              <p v-if="!watchlist.length" class="stock-pos-empty">Keine Positionen erfasst</p>
              <template v-for="section in watchlistByPortfolioSorted" :key="section.key">
                <div class="stock-group-wrap" :style="{ background: colorHex(section.portfolio?.color) + '18' }">
                <template v-for="group in section.groups" :key="group.symbol">
                  <div
                    class="stock-pos-row"
                    @mouseenter="hoveredStockId = group.symbol"
                    @mouseleave="hoveredStockId = null"
                  >
                    <div class="stock-pos-info">
                      <span class="stock-pos-symbol">{{ group.symbol }}</span>
                      <span class="stock-pos-name-txt">{{ group.name }}</span>
                    </div>
                    <div class="stock-col-value font-[SUSE_Mono]">
                      <template v-if="group.totalShares && group.price != null">
                        <FlipNumber :value="fmt(convert(group.totalShares * group.price, group.currency))" />
                        <span class="stock-pos-currency">{{ companyCurrency }}</span>
                        <span v-if="group.currency !== companyCurrency" class="stock-pos-orig-currency">
                          {{ fmt(group.totalShares * group.price) }} {{ group.currency }}
                        </span>
                      </template>
                      <span v-else class="opacity-30">—</span>
                    </div>
                    <div class="stock-col-pnl font-[SUSE_Mono]" :class="group.totalShares && group.avgPurchasePrice && group.price != null ? (groupStockPnl(group) >= 0 ? 'pnl-positive' : 'pnl-negative') : ''">
                      <template v-if="group.totalShares && group.avgPurchasePrice && group.price != null">
                        {{ groupStockPnl(group) >= 0 ? '+' : '' }}<FlipNumber :value="fmt(groupStockPnl(group))" />
                      </template>
                      <span v-else class="opacity-30">—</span>
                    </div>
                    <div class="stock-col-change font-[SUSE_Mono]" :class="group.changePercent != null ? (group.changePercent >= 0 ? 'pnl-positive' : 'pnl-negative') : ''">
                      <template v-if="group.changePercent != null">
                        {{ group.changePercent >= 0 ? '+' : '' }}{{ group.changePercent.toFixed(2) }}%
                      </template>
                      <span v-else class="opacity-30">—</span>
                    </div>
                    <div class="stock-col-actions" :class="{ 'stock-col-actions--visible': hoveredStockId === group.symbol }">
                      <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="xs" @click.stop="openEditStock(group, group.tranches[0])" />
                      <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="xs" :loading="removingStockId === group.tranches[0].id" @click.stop="removeFromWatchlist(group.tranches[0].id)" />
                    </div>
                  </div>
                  <!-- Tranchen wenn mehrere -->
                  <div v-if="group.tranches.length > 1" class="stock-tranchen">
                    <div
                      v-for="t in group.tranches"
                      :key="t.id"
                      class="stock-tranche-row"
                      @mouseenter="hoveredStockId = t.id"
                      @mouseleave="hoveredStockId = null"
                    >
                      <span class="stock-pos-qty font-[SUSE_Mono]">{{ t.shares }} Stk.<span v-if="t.purchaseDate" class="opacity-50"> · {{ t.purchaseDate }}</span></span>
                      <div class="stock-col-value font-[SUSE_Mono]">
                        <template v-if="group.price != null && t.shares">
                          <FlipNumber :value="fmt(convert(t.shares * group.price, group.currency))" />
                          <span class="stock-pos-currency">{{ companyCurrency }}</span>
                          <span v-if="group.currency !== companyCurrency" class="stock-pos-orig-currency">
                            {{ fmt(t.shares * group.price) }} {{ group.currency }}
                          </span>
                        </template>
                        <span v-else class="opacity-30">—</span>
                      </div>
                      <div class="stock-col-pnl"></div>
                      <div class="stock-col-change"></div>
                      <div class="stock-col-actions" :class="{ 'stock-col-actions--visible': hoveredStockId === t.id }">
                        <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="xs" @click.stop="openEditStock(group, t)" />
                        <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="xs" :loading="removingStockId === t.id" @click.stop="removeFromWatchlist(t.id)" />
                      </div>
                    </div>
                  </div>
                </template>
                </div>
              </template>
            </div>
            </OverlayScrollbarsComponent>
            </template>
          </div>


          <!-- Spalte 3: Portfolio-Stack (als Filter) -->
          <FinanceBrokerStack
            :sections="aktienPortfolioStacks.map(p => ({ id: p.portfolio.id, color: colorHex(p.portfolio.color), height: aktienPortfolioHeight(p.portfolio.id), label: p.portfolio.name, value: p.value }))"
            :total-value="aktienPortfolioStacks.reduce((s, p) => s + p.value, 0)"
            :cash-total="cashBalances.reduce((s, c) => s + convert(c.amount, c.currency), 0)"
            :cash-percent="aktienPortfolioStacks.reduce((s, p) => s + p.value, 0) > 0 ? (cashBalances.reduce((s, c) => s + convert(c.amount, c.currency), 0) / aktienPortfolioStacks.reduce((s, p) => s + p.value, 0)) * 100 : 0"
            :visible="brokerStackVisible"
            icon="i-lucide-chart-candlestick"
            @select="selectedPortfolioId = selectedPortfolioId === $event ? null : $event"
            @reset="selectedPortfolioId = null"
          >
            <template #section="{ section }">
              <div class="broker-name">{{ section.label }}</div>
              <div class="broker-bottom">
                <div v-if="cashBalances.find(c => c.portfolioId === section.id)" class="broker-cash-badge font-[SUSE_Mono]">
                  <UIcon name="i-lucide-banknote" class="w-3 h-3" />
                  {{ fmt(convert(cashBalances.find(c => c.portfolioId === section.id)!.amount, cashBalances.find(c => c.portfolioId === section.id)!.currency)) }}
                  {{ companyCurrency }} Cash
                </div>
                <div class="broker-value font-[SUSE_Mono]">
                  <FlipNumber :value="Math.round(section.value).toLocaleString('de-CH')" />
                </div>
              </div>
            </template>
          </FinanceBrokerStack>

          <!-- Spalte 3: Dividende + Platzhalter -->
          <div class="flex flex-col gap-4">
            <div class="dividend-card placeholder-card">
              <div class="dividend-top">
                <span class="dividend-label">Erwartete Dividende</span>
                <button class="dividend-tax-toggle" :class="{ 'dividend-tax-toggle--active': taxDeductionEnabled }" :title="taxDeductionEnabled ? 'Steuer aktiv' : 'Steuer deaktiviert'" @click="taxDeductionEnabled = !taxDeductionEnabled">
                  <UIcon name="i-lucide-receipt-swiss-franc" class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-if="dividendsPending && !dividends.length" class="dividend-skeleton-wrap">
                <USkeleton class="dividend-skeleton-amount" />
                <USkeleton class="dividend-skeleton-sub" />
                <USkeleton v-for="n in 3" :key="n" class="dividend-skeleton-row" />
              </div>
              <template v-else>
                <div class="dividend-amount font-[SUSE_Mono]"><FlipNumber :value="fmt(totalDividendChf)" /></div>
                <div class="dividend-sub">
                  <span class="dividend-year font-[SUSE_Mono]">{{ companyCurrency }} / Jahr</span>
                  <span v-if="dividendAvgYield > 0" class="dividend-yield font-[SUSE_Mono]">{{ dividendAvgYield.toFixed(1) }}%</span>
                </div>
                <OverlayScrollbarsComponent v-if="dividends.length" :options="osOptions" class="dividend-list" defer>
                  <div v-for="d in dividends" :key="d.symbol" class="dividend-row">
                    <span class="dividend-sym">{{ d.symbol }}</span>
                    <div class="dividend-row-right">
                      <span v-if="d.yield != null" class="dividend-row-pct font-[SUSE_Mono]">{{ (d.yield * dividendTaxFactor).toFixed(2) }}%</span>
                      <span class="dividend-val font-[SUSE_Mono]"><FlipNumber :value="fmt(convert(d.annualDividend ?? 0, d.currency) * dividendTaxFactor)" /></span>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>
                <p v-else class="dividend-empty">Keine Daten</p>
              </template>
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
        <FinanceBrokerStack
          :sections="metalGroups.map(m => ({ id: m.key, color: m.color, height: metalHeight(m.value, m.key), label: m.name, value: m.value, extraClass: `metal-section metal-${m.key}` }))"
          :total-value="metalGroups.reduce((s, m) => s + m.value, 0)"
          :visible="metalStackVisible"
          icon="i-lucide-gem"
          @select="selectedMetalKey = selectedMetalKey === $event ? null : $event; openCoinGroups.value = new Set()"
          @reset="selectedMetalKey = null"
        >
          <template #section="{ section }">
            <div class="metal-sheen" />
            <div class="broker-name">{{ section.label }}</div>
            <div class="broker-bottom">
              <div class="broker-change-badge font-[SUSE_Mono]" :class="metalGroups.find(m => m.key === section.id)!.change >= 0 ? 'badge-positive' : 'badge-negative'">
                <UIcon name="i-lucide-triangle" class="w-2 h-2" :class="metalGroups.find(m => m.key === section.id)!.change >= 0 ? '' : 'rotate-180'" />
                {{ metalGroups.find(m => m.key === section.id)!.change >= 0 ? '+' : '' }}{{ metalGroups.find(m => m.key === section.id)!.change.toFixed(1) }}%
              </div>
              <div class="broker-value font-[SUSE_Mono]"><FlipNumber :value="Math.round(section.value).toLocaleString('de-CH')" /></div>
            </div>
          </template>
        </FinanceBrokerStack>
        <!-- Positionen rechts -->
        <div class="placeholder-card metal-positions-card">
          <div v-if="metalsPending" class="card-skeleton-wrap">
            <USkeleton v-for="n in 4" :key="n" class="row-skeleton" />
          </div>
          <OverlayScrollbarsComponent v-else :options="osOptions" class="metal-pos-scroll" defer>
          <div class="metal-pos-list">
            <div
              v-for="group in metalHoldingsGrouped.filter(g => !selectedMetalKey || g.metalKey === selectedMetalKey)"
              :key="group.metalKey"
              class="metal-group-wrap"
              :style="{ background: (METAL_COLORS[group.metalKey] ?? '#aaa') + '18' }"
            >
              <!-- Coin-Gruppen -->
              <div class="metal-group-body">
                <div v-for="cg in group.coinGroups" :key="cg.key">
                  <!-- Coin-Zeile -->
                  <div
                    class="metal-pos-row"
                    :class="{ 'metal-pos-row-clickable': cg.items.length > 1 }"
                    @click="cg.items.length > 1 && toggleCoinGroup(cg.key)"
                    @mouseenter="hoveredRowId = cg.key"
                    @mouseleave="hoveredRowId = null"
                  >
                    <div class="metal-pos-info">
                      <span class="metal-pos-name">{{ cg.coinType || metalNameLabel(group.metalKey) }}</span>
                      <span class="metal-pos-qty font-[SUSE_Mono]">
                        {{ cg.items.reduce((s: number, h: any) => s + h.quantity, 0) }} {{ cg.items[0]?.unit }}
                        <span v-if="cg.items.length > 1" class="opacity-50">· {{ cg.items.length }} Tranchen</span>
                      </span>
                    </div>
                    <div class="metal-pos-right">
                      <div class="metal-pos-value-row">
                        <UButton v-if="hoveredRowId === cg.key" variant="ghost" color="neutral" icon="i-lucide-pencil" size="xs" @click.stop="openEditHolding(cg.items[0])" />
                        <span class="metal-pos-value font-[SUSE_Mono]"><FlipNumber :value="Math.round(cg.total).toLocaleString('de-CH')" /> {{ companyCurrency }}</span>
                      </div>
                      <span
                        v-if="cg.pnlPct != null"
                        class="metal-pos-pnl font-[SUSE_Mono]"
                        :class="cg.pnlPct >= 0 ? 'pnl-positive' : 'pnl-negative'"
                      >{{ cg.pnlPct >= 0 ? '+' : '' }}{{ cg.pnlPct.toFixed(1) }}%</span>
                    </div>
                  </div>
                  <!-- Tranchen -->
                  <div v-if="cg.items.length > 1 && openCoinGroups.has(cg.key)" class="metal-tranchen">
                    <div v-for="t in cg.items" :key="t.id" class="metal-tranche-row" @mouseenter="hoveredRowId = t.id" @mouseleave="hoveredRowId = null">
                      <div class="metal-pos-info">
                        <span class="metal-pos-qty font-[SUSE_Mono]">{{ t.quantity }} {{ t.unit }}</span>
                        <span v-if="t.purchaseDate" class="metal-tranche-date">{{ t.purchaseDate }}</span>
                      </div>
                      <div class="metal-pos-right">
                        <div class="metal-pos-value-row">
                          <UButton v-if="hoveredRowId === t.id" variant="ghost" color="neutral" icon="i-lucide-pencil" size="xs" @click.stop="openEditHolding(t)" />
                          <span class="metal-pos-value font-[SUSE_Mono]"><FlipNumber v-if="t.currentTotal != null" :value="Math.round(t.currentTotal).toLocaleString('de-CH')" /><span v-else>—</span> {{ companyCurrency }}</span>
                        </div>
                        <span
                          v-if="t.pnlPct != null"
                          class="metal-pos-pnl font-[SUSE_Mono]"
                          :class="t.pnlPct >= 0 ? 'pnl-positive' : 'pnl-negative'"
                        >{{ t.pnlPct >= 0 ? '+' : '' }}{{ t.pnlPct.toFixed(1) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!metalHoldings?.length" class="metal-pos-empty">Keine Positionen erfasst</div>
          </div>
          </OverlayScrollbarsComponent>
        </div>
        </div>
      </section>

      <!-- Edit Holding Modal -->
      <UModal
        v-model:open="editHoldingOpen"
        :ui="{
          overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
          content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
          header: 'border-b border-white/20 dark:border-white/10',
          body: 'p-0',
          footer: 'border-t border-white/20 dark:border-white/10',
        }"
      >
        <template #header>
          <h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white">Edelmetall bearbeiten</h2>
        </template>
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
              <div v-if="!editHoldingPiecesMode" class="grid grid-cols-2 gap-3">
                <UInput v-model="editHoldingForm.quantity" type="number" step="0.001" placeholder="z.B. 10" />
                <USelect v-model="editHoldingForm.unit" :items="unitOptions" />
              </div>
              <div v-else class="space-y-2">
                <div class="flex items-center gap-2">
                  <UInput v-model="editHoldingPieces.count" type="number" step="1" min="1" placeholder="Stk." class="w-24" @input="calcEditPieces" />
                  <span class="text-sm text-gray-400 shrink-0">Stk. ×</span>
                  <UInput v-model="editHoldingPieces.weight" type="number" step="0.001" placeholder="Gewicht" class="flex-1" @input="calcEditPieces" />
                  <USelect v-model="editHoldingForm.unit" :items="unitOptions" class="w-32" @change="calcEditPieces" />
                </div>
                <p v-if="editHoldingForm.quantity" class="text-xs text-gray-500">
                  Gesamt: <span class="font-semibold">{{ editHoldingForm.quantity }} {{ editHoldingForm.unit }}</span>
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
          <div class="flex items-center justify-between w-full">
            <UButton variant="ghost" color="error" icon="i-lucide-trash-2" :loading="deleteHoldingLoading" @click="deleteHolding">Löschen</UButton>
            <div class="flex gap-2">
              <UButton variant="ghost" color="neutral" @click="editHoldingOpen = false">Abbrechen</UButton>
              <UButton :loading="editHoldingLoading" :style="{ background: '#1e3a5f' }" color="primary" @click="saveEditHolding">Speichern</UButton>
            </div>
          </div>
        </template>
      </UModal>

      <!-- BARGELD -->
      <section class="space-y-3">
        <h2 class="text-[1.925rem] italic font-instrument">Bargeld</h2>
        <div class="placeholder-card cash-card">
          <div class="cash-card-header">
            <span class="cash-card-title">Cash-Bestände</span>
            <span class="cash-card-total font-[SUSE_Mono]">
              {{ fmt(cashBalances.reduce((s, c) => s + convert(c.amount, c.currency), 0)) }} {{ companyCurrency }}
            </span>
          </div>
          <div v-if="!cashBalances.length" class="cash-empty">Kein Cash erfasst</div>
          <div v-else class="cash-rows">
            <div v-for="c in cashBalances" :key="c.id" class="cash-entry" @mouseenter="hoveredCashId = c.id" @mouseleave="hoveredCashId = null">
              <div class="cash-entry-left">
                <UIcon name="i-lucide-banknote" class="w-4 h-4 opacity-40" />
                <span class="cash-entry-portfolio">{{ portfolios.find((p: any) => p.id === c.portfolioId)?.name ?? '—' }}</span>
              </div>
              <div class="cash-entry-right">
                <span class="cash-entry-value font-[SUSE_Mono]">
                  {{ fmt(c.amount) }} <span class="cash-entry-curr">{{ c.currency }}</span>
                  <span v-if="c.currency !== companyCurrency" class="cash-entry-converted">({{ fmt(convert(c.amount, c.currency)) }} {{ companyCurrency }})</span>
                </span>
                <div class="cash-entry-actions" :class="{ 'cash-entry-actions--visible': hoveredCashId === c.id }">
                  <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="xs" @click.stop="deleteCash(c.id)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>

  <!-- Add Stock / Cash Modal -->
  <UModal
    v-model:open="addStockOpen"
    :ui="{
      overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
      content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
      header: 'border-b border-white/20 dark:border-white/10',
      footer: 'border-t border-white/20 dark:border-white/10',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white">
          {{ addModalTab === 'stock' ? 'Aktie hinzufügen' : 'Cash eintragen' }}
        </h2>
        <div class="modal-tabs">
          <button class="modal-tab" :class="addModalTab === 'stock' ? 'modal-tab--active' : ''" @click="addModalTab = 'stock'">
            <UIcon name="i-lucide-chart-candlestick" class="w-3.5 h-3.5" />
            Aktie
          </button>
          <button class="modal-tab" :class="addModalTab === 'cash' ? 'modal-tab--active' : ''" @click="addModalTab = 'cash'">
            <UIcon name="i-lucide-banknote" class="w-3.5 h-3.5" />
            Cash
          </button>
        </div>
      </div>
    </template>
    <template #body>
      <!-- Tab: Aktie -->
      <div v-if="addModalTab === 'stock'" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in portfolios.filter((p: any) => p.portfolioType === 'Aktien')"
            :key="p.id"
            class="add-portfolio-pill"
            :class="addPortfolioId === p.id ? 'add-portfolio-pill-active' : ''"
            :style="addPortfolioId === p.id ? { background: colorHex(p.color), color: '#fff', borderColor: colorHex(p.color) } : { borderColor: colorHex(p.color) + '60' }"
            @click="addPortfolioId = p.id"
          >
            <span class="add-portfolio-dot" :style="{ background: colorHex(p.color) }" />
            {{ p.name }}
          </button>
        </div>
        <UInput
          v-model="addSearchQuery"
          placeholder="Ticker oder Name suchen (z.B. NESN, Apple)"
          icon="i-lucide-search"
          autofocus
          class="modal-input"
          @input="onAddSearchInput"
        />
        <div v-if="addSearchLoading" class="flex justify-center py-4">
          <UIcon name="i-lucide-loader-circle" class="animate-spin text-gray-400 w-5 h-5" />
        </div>
        <div v-else-if="addSearchResults.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="r in addSearchResults" :key="r.symbol" class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium shrink-0">{{ r.symbol }}</span>
              <span class="text-sm text-gray-500 truncate">{{ r.name }}</span>
              <UBadge variant="subtle" color="neutral" class="shrink-0">{{ r.exchange }}</UBadge>
            </div>
            <UButton size="sm" icon="i-lucide-plus" :loading="addingSymbol === r.symbol" class="ml-3 shrink-0" @click="addStockToWatchlist(r)">
              Hinzufügen
            </UButton>
          </div>
        </div>
        <p v-else-if="addSearchQuery && !addSearchLoading" class="text-sm text-gray-500">Keine Ergebnisse für „{{ addSearchQuery }}"</p>
      </div>
      <!-- Tab: Cash -->
      <div v-else class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in portfolios.filter((p: any) => p.portfolioType === 'Aktien')"
            :key="p.id"
            class="add-portfolio-pill"
            :class="addCashForm.portfolioId === p.id ? 'add-portfolio-pill-active' : ''"
            :style="addCashForm.portfolioId === p.id ? { background: colorHex(p.color), color: '#fff', borderColor: colorHex(p.color) } : { borderColor: colorHex(p.color) + '60' }"
            @click="addCashForm.portfolioId = p.id"
          >
            <span class="add-portfolio-dot" :style="{ background: colorHex(p.color) }" />
            {{ p.name }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Betrag">
            <UInput v-model="addCashForm.amount" type="number" step="0.01" placeholder="0.00" class="modal-input w-full" />
          </UFormField>
          <UFormField label="Währung">
            <USelect v-model="addCashForm.currency" :items="currencyOptions" class="modal-input w-full" />
          </UFormField>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="addStockOpen = false">Abbrechen</UButton>
        <UButton v-if="addModalTab === 'cash'" :loading="addCashLoading" :style="{ background: '#1e3a5f' }" color="primary" icon="i-lucide-check" @click="saveCash">Speichern</UButton>
      </div>
    </template>
  </UModal>

  <!-- Edit Stock Modal -->
  <UModal
    v-model:open="editStockOpen"
    :ui="{
      overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
      content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
      header: 'border-b border-white/20 dark:border-white/10',
      footer: 'border-t border-white/20 dark:border-white/10',
    }"
  >
    <template #header>
      <div>
        <h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white">{{ editStockItem?.symbol }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ editStockItem?.name }}</p>
      </div>
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Portfolio">
          <USelect
            v-model="editStockForm.portfolioId"
            :items="[{ label: 'Kein Portfolio', value: 'none' }, ...portfolios.map((p: any) => ({ label: p.name, value: p.id }))]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Anzahl Aktien">
          <UInput v-model="editStockForm.shares" type="number" step="0.0001" placeholder="z.B. 10" class="w-full" />
        </UFormField>
        <UFormField label="Kaufdatum">
          <UInput v-model="editStockForm.purchaseDate" type="date" class="w-full" />
        </UFormField>
        <UFormField :label="`Kaufpreis pro Aktie (${editStockItem?.currency ?? 'CHF'})`">
          <UInput v-model="editStockForm.purchasePrice" type="number" step="0.01" placeholder="z.B. 85.50" class="w-full" />
        </UFormField>
        <div v-if="editStockForm.shares && editStockForm.purchasePrice" class="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500">Investiert</span>
            <span class="font-medium font-[SUSE_Mono]">{{ fmt(Number(editStockForm.shares) * Number(editStockForm.purchasePrice)) }} {{ editStockItem?.currency }}</span>
          </div>
          <div v-if="editStockItem?.price != null" class="flex justify-between">
            <span class="text-gray-500">Aktueller Wert</span>
            <span class="font-medium font-[SUSE_Mono]">{{ fmt(Number(editStockForm.shares) * editStockItem.price) }} {{ editStockItem?.currency }}</span>
          </div>
          <div v-if="editStockItem?.price != null" class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
            <span class="text-gray-500">Gewinn / Verlust</span>
            <span
              class="font-semibold font-[SUSE_Mono]"
              :class="(editStockItem.price - Number(editStockForm.purchasePrice)) * Number(editStockForm.shares) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'"
            >
              {{ ((editStockItem.price - Number(editStockForm.purchasePrice)) * Number(editStockForm.shares)) >= 0 ? '+' : '' }}{{ fmt((editStockItem.price - Number(editStockForm.purchasePrice)) * Number(editStockForm.shares)) }}
            </span>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton variant="ghost" color="error" icon="i-lucide-trash-2" :loading="removingStockId === editStockTranche?.id" @click="removeFromWatchlist(editStockTranche!.id); editStockOpen = false">Löschen</UButton>
        <div class="flex gap-2">
          <UButton variant="ghost" color="neutral" @click="editStockOpen = false">Abbrechen</UButton>
          <UButton :loading="editStockLoading" :style="{ background: '#1e3a5f' }" color="primary" @click="saveEditStock">Speichern</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
const { confirm } = useConfirm()
import 'overlayscrollbars/overlayscrollbars.css'

definePageMeta({ middleware: 'auth' })

const osOptions = { scrollbars: { autoHide: 'scroll' as const, autoHideDelay: 600 } }

const { data: companyData } = await useFetch<{ currency: string; dividendTax: number }>('/api/settings/company')
const companyCurrency = computed(() => companyData.value?.currency ?? 'CHF')
const taxDeductionEnabled = ref(true)
const dividendTaxFactor = computed(() => taxDeductionEnabled.value ? 1 - (companyData.value?.dividendTax ?? 0) / 100 : 1)

type SummaryGroup = { type: string; value: number; changePct: number; color: string; count: number }
type Summary = { groups: SummaryGroup[]; totalValue: number; totalChangePct: number }

const { data: summary, pending: summaryPending } = await useFetch<Summary>('/api/finance/portfolio-summary')

const metalsTotalFrontend = computed(() =>
  (metalHoldings.value ?? []).reduce((s: number, m: any) => {
    if (m.currentTotal == null) return s
    return s + convert(m.currentTotal, m.currency ?? 'CHF')
  }, 0)
)

const miniCards = computed(() => {
  const groups = summary.value?.groups ?? []
  const metalsFromFrontend = metalsTotalFrontend.value
  const patched = groups.map(g => g.type === 'Edelmetalle' && g.value === 0 && metalsFromFrontend > 0
    ? { ...g, value: Math.round(metalsFromFrontend) }
    : g
  )
  const total = patched.reduce((s, g) => s + g.value, 0) || 1
  return patched.map(g => ({
    label:    g.type,
    value:    g.value,
    change:   g.changePct,
    color:    g.color,
    progress: Math.round((g.value / total) * 100),
  }))
})

const pillBg = '#1e3a5f'
function hexToRgb(hex: string) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }
}
function neumorphicShadow(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const light = `rgba(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)},0.75)`
  const dark  = `rgba(${Math.max(0,r-80)},${Math.max(0,g-80)},${Math.max(0,b-80)},0.75)`
  return `-5px -5px 12px ${light}, 5px 5px 12px ${dark}, inset 0 1px 2px rgba(255,255,255,0.7)`
}
const miniCardShadow = neumorphicShadow(pillBg)
const totalValue = computed(() => miniCards.value.reduce((s, c) => s + c.value, 0))
const totalChange = computed(() => {
  const total = totalValue.value
  if (total === 0) return summary.value?.totalChangePct ?? 0
  return parseFloat((miniCards.value.reduce((s, c) => s + c.change * c.value, 0) / total).toFixed(2))
})
const glowKey = ref(0)

const periods = ['1D', '1W', '1M', 'YTD', '1Y'] as const
type Period = typeof periods[number]
const selectedPeriod = ref<Period>('1D')

const periodData = computed<Record<Period, { pct: number; chf: number }>>(() => {
  const pct1D = totalChange.value
  const chf1D = Math.round(totalValue.value * pct1D / 100)
  return {
    '1D':  { pct: pct1D,  chf: chf1D  },
    '1W':  { pct: +2.13,  chf: +3580  },
    '1M':  { pct: -0.92,  chf: -1540  },
    'YTD': { pct: +7.42,  chf: +12300 },
    '1Y':  { pct: +19.2,  chf: +28750 },
  }
})

const currentPeriodData = computed(() => periodData.value[selectedPeriod.value])
const pillExpanded = ref(false)

onMounted(() => {
  setInterval(() => { glowKey.value++ }, 5000)
})

function brokerHeight(value: number) {
  const total = brokers.value.reduce((s, b) => s + b.value, 0)
  return `${((value / total) * 100).toFixed(2)}%`
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

// ── Edelmetalle ──
const METAL_COLORS: Record<string, string> = {
  gold:      '#d4a94a',
  silver:    '#9eb3be',
  platinum:  '#7ab8e0',
  palladium: '#7acfa0',
}
const METAL_NAMES: Record<string, string> = {
  gold:      'Gold',
  silver:    'Silber',
  platinum:  'Platin',
  palladium: 'Palladium',
}

type MetalHolding = {
  id: string
  metalKey: string
  coinType: string | null
  quantity: number
  unit: string
  purchaseDate: string | null
  purchasePricePerOz: number | null
  purchaseCurrency: string | null
  currentTotal: number | null
  pnlPct: number | null
  portfolioId: string | null
}
const { data: metalHoldings, refresh: refreshMetals, pending: metalsPending } = await useFetch<MetalHolding[]>('/api/metals/holdings', { query: { currency: companyCurrency } })

const metalGroups = computed(() => {
  const groups: Record<string, { key: string; name: string; color: string; value: number; changeSum: number; changeWeight: number }> = {}
  for (const h of metalHoldings.value ?? []) {
    const key = h.metalKey
    const val = h.currentTotal ?? 0
    const pct = h.pnlPct ?? 0
    if (!groups[key]) groups[key] = { key, name: METAL_NAMES[key] ?? key, color: METAL_COLORS[key] ?? '#aaa', value: 0, changeSum: 0, changeWeight: 0 }
    groups[key].value += val
    groups[key].changeSum += pct * val
    groups[key].changeWeight += val
  }
  return Object.values(groups)
    .map(g => ({ ...g, change: g.changeWeight > 0 ? parseFloat((g.changeSum / g.changeWeight).toFixed(2)) : 0 }))
    .sort((a, b) => b.value - a.value)
})

const selectedMetalKey = ref<string | null>(null)

function metalHeight(value: number, key: string) {
  if (selectedMetalKey.value === null) {
    const total = metalGroups.value.reduce((s, m) => s + m.value, 0)
    return `${((value / total) * 100).toFixed(2)}%`
  }
  if (key === selectedMetalKey.value) return '65%'
  const others = metalGroups.value.length - 1
  return `${(35 / Math.max(1, others)).toFixed(2)}%`
}

const toast = useToast()

const G_PER_OZ = 31.1035
function priceFromPerOz(pricePerOz: number, unit: string) {
  if (unit === 'g') return pricePerOz / G_PER_OZ
  if (unit === 'kg') return pricePerOz / G_PER_OZ * 1000
  return pricePerOz
}
function priceToPerOz(price: number, unit: string) {
  if (unit === 'g') return price * G_PER_OZ
  if (unit === 'kg') return price * G_PER_OZ / 1000
  return price
}

const currencyOptions = [
  { label: 'CHF', value: 'CHF' },
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
]

const unitOptions = [
  { label: 'Gramm (g)', value: 'g' },
  { label: 'Kilogramm (kg)', value: 'kg' },
  { label: 'Feinunze (oz)', value: 'oz' },
]

const COIN_OPTIONS: Record<string, string[]> = {
  gold:      ['Goldbarren', 'Krugerrand', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'American Buffalo', 'Britannia', 'Vreneli 20Fr', 'Vreneli 10Fr', 'Nugget/Känguru', 'Sonstige'],
  silver:    ['Silberbarren', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'Britannia', 'Krugerrand', 'Sonstige'],
  platinum:  ['Platinbarren', 'Maple Leaf', 'Wiener Philharmoniker', 'American Eagle', 'Sonstige'],
  palladium: ['Palladiumbarren', 'Maple Leaf', 'Sonstige'],
}

const editHoldingOpen = ref(false)
const editHoldingLoading = ref(false)
const editHoldingId = ref<string | null>(null)
const editHoldingPriceLoading = ref(false)
const editHoldingPiecesMode = ref(false)
const editHoldingPieces = reactive({ count: '', weight: '' })
const editHoldingForm = reactive({
  metalKey: 'gold', coinType: '', quantity: '', unit: 'oz',
  purchaseDate: '', purchasePricePerOz: '', purchaseCurrency: 'CHF',
})

function calcEditPieces() {
  const c = parseFloat(editHoldingPieces.count)
  const w = parseFloat(editHoldingPieces.weight)
  if (c > 0 && w > 0) editHoldingForm.quantity = String(Math.round(c * w * 100000) / 100000)
}

const editCoinOptions = computed(() =>
  (COIN_OPTIONS[editHoldingForm.metalKey] ?? []).map(c => ({ label: c, value: c }))
)

async function fetchMetalPriceAtDateEdit() {
  if (!editHoldingForm.metalKey || !editHoldingForm.purchaseDate) return
  editHoldingPriceLoading.value = true
  editHoldingForm.purchasePricePerOz = ''
  try {
    const res = await $fetch<{ price: number | null }>(`/api/metals/price-at?metalKey=${editHoldingForm.metalKey}&date=${editHoldingForm.purchaseDate}&currency=${editHoldingForm.purchaseCurrency}`)
    if (res.price != null) editHoldingForm.purchasePricePerOz = priceFromPerOz(res.price, editHoldingForm.unit).toFixed(4)
  } catch {
    toast.add({ title: 'Kurs nicht verfügbar', description: 'Bitte Kaufpreis manuell eingeben.', color: 'warning' })
  } finally {
    editHoldingPriceLoading.value = false
  }
}

function openEditHolding(h: any) {
  editHoldingId.value = h.id
  editHoldingForm.metalKey = h.metalKey
  editHoldingForm.coinType = h.coinType ?? ''
  editHoldingForm.quantity = String(h.quantity)
  editHoldingForm.unit = h.unit
  editHoldingForm.purchaseDate = h.purchaseDate ?? ''
  editHoldingForm.purchasePricePerOz = h.purchasePricePerOz != null ? priceFromPerOz(h.purchasePricePerOz, h.unit).toFixed(4) : ''
  editHoldingForm.purchaseCurrency = h.purchaseCurrency ?? 'CHF'
  editHoldingPiecesMode.value = false
  editHoldingOpen.value = true
}

const deleteHoldingLoading = ref(false)
async function deleteHolding() {
  if (!editHoldingId.value) return
  const ok = await confirm('Diesen Edelmetall-Eintrag wirklich löschen?', 'Eintrag löschen')
  if (!ok) return
  deleteHoldingLoading.value = true
  try {
    await $fetch(`/api/metals/holdings/${editHoldingId.value}`, { method: 'DELETE' })
    await refreshMetals()
    editHoldingOpen.value = false
  } finally {
    deleteHoldingLoading.value = false
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
      },
    })
    await refreshMetals()
    editHoldingOpen.value = false
  } finally {
    editHoldingLoading.value = false
  }
}

const metalIcon = (key: string) => ({ gold: '🥇', silver: '🥈', platinum: '⚪', palladium: '🔵' }[key] ?? '●')
const metalNameLabel = (key: string) => ({ gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium' }[key] ?? key)

const openMetalGroups = ref(new Set<string>())
const openCoinGroups = ref(new Set<string>())
const hoveredRowId = ref<string | null>(null)
function toggleCoinGroup(key: string) {
  if (openCoinGroups.value.has(key)) openCoinGroups.value.delete(key)
  else openCoinGroups.value.add(key)
  openCoinGroups.value = new Set(openCoinGroups.value)
}
function toggleMetalGroup(key: string) {
  if (openMetalGroups.value.has(key)) openMetalGroups.value.delete(key)
  else openMetalGroups.value.add(key)
}

const metalHoldingsGrouped = computed(() => {
  const map = new Map<string, any[]>()
  for (const h of metalHoldings.value ?? []) {
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
          coinType: citems[0]?.coinType ?? '',
          items: citems,
          total: citems.reduce((s: number, h: any) => s + (h.currentTotal ?? 0), 0),
          pnlPct: citems[0]?.pnlPct ?? null,
        })),
      }
    })
})

const metalStackVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    brokerStackVisible.value = true
    metalStackVisible.value = true
  }, 100)
})

// ── Aktien ──
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

const { data: portfoliosData } = await useFetch<any[]>('/api/portfolios')
const portfolios = computed(() => portfoliosData.value ?? [])

const { data: cashData, refresh: refreshCash } = await useFetch<any[]>('/api/finance/cash')
const cashBalances = computed(() => cashData.value ?? [])

const { data: watchlistData, refresh: refreshWatchlist, pending: watchlistPending } = await useFetch<WatchlistGroup[]>('/api/stocks/watchlist')
const watchlist = computed(() => watchlistData.value ?? [])

// ── FX (hier, damit convert() für Aktien-Computeds verfügbar ist) ──
const { data: fxData } = await useFetch<Record<string, number>>('/api/stocks/fx')
const fx = computed(() => ({ CHF: 1, ...(fxData.value ?? { USD: 0.9, EUR: 0.95, GBP: 1.12 }) }))
// Konvertiert einen Betrag von einer Währung in die Firmenwährung (via CHF als Zwischenwährung)
function convert(amount: number, fromCurrency: string): number {
  const inChf = amount * (fx.value[fromCurrency] ?? 1)
  return inChf / (fx.value[companyCurrency.value] ?? 1)
}
function toChf(amount: number, currency: string) { return amount * (fx.value[currency] ?? 1) }

const PORTFOLIO_COLORS = [
  { value: 'blue', hex: '#3b82f6' }, { value: 'green', hex: '#22c55e' },
  { value: 'yellow', hex: '#eab308' }, { value: 'red', hex: '#ef4444' },
  { value: 'purple', hex: '#a855f7' }, { value: 'orange', hex: '#f97316' },
  { value: 'gray', hex: '#6b7280' }, { value: 'cyan', hex: '#06b6d4' },
  { value: 'pink', hex: '#ec4899' },
]
const colorHex = (c: string) => PORTFOLIO_COLORS.find(p => p.value === c)?.hex ?? '#6b7280'
const portfolioById = (id: string | null) => id ? portfolios.value.find((p: any) => p.id === id) : null

const fmt = (n: number) => Math.abs(n).toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function groupStockPnl(g: WatchlistGroup) {
  if (!g.totalShares || !g.avgPurchasePrice || g.price == null) return 0
  return convert((g.price - g.avgPurchasePrice) * g.totalShares, g.currency)
}

const selectedPortfolioId = ref<string | null>(null)

const aktienPortfolioStacks = computed(() => {
  // Alle Aktien-Portfolios als Basis
  const map = new Map<string, { portfolio: any; value: number }>()
  for (const p of portfolios.value.filter((p: any) => p.portfolioType === 'Aktien')) {
    map.set(p.id, { portfolio: p, value: 0 })
  }
  // Werte aus Watchlist berechnen
  for (const g of watchlist.value) {
    const price = g.price ?? 0
    for (const t of g.tranches) {
      const pid = t.portfolioId
      if (!pid || !map.has(pid)) continue
      map.get(pid)!.value += convert(price * (t.shares ?? 0), g.currency)
    }
  }
  // Cash-Bestände einrechnen
  for (const c of cashBalances.value) {
    if (!c.portfolioId || !map.has(c.portfolioId)) continue
    map.get(c.portfolioId)!.value += convert(c.amount, c.currency)
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
})

function aktienPortfolioHeight(pid: string) {
  if (selectedPortfolioId.value === null) {
    const stacks = aktienPortfolioStacks.value
    const total = stacks.reduce((s, p) => s + p.value, 0)
    const p = stacks.find(p => p.portfolio.id === pid)
    if (!p || total === 0) return '0%'
    return `${((p.value / total) * 100).toFixed(2)}%`
  }
  if (pid === selectedPortfolioId.value) return '65%'
  const others = aktienPortfolioStacks.value.length - 1
  return `${(35 / Math.max(1, others)).toFixed(2)}%`
}

const watchlistByPortfolio = computed(() => {
  const map = new Map<string, { key: string; portfolio: any | null; groups: WatchlistGroup[] }>()
  for (const g of watchlist.value) {
    const pid = g.tranches[0]?.portfolioId ?? null
    const key = pid ?? '__none__'
    if (!map.has(key)) map.set(key, { key, portfolio: portfolioById(pid), groups: [] })
    map.get(key)!.groups.push(g)
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.portfolio && b.portfolio) return 1
    if (a.portfolio && !b.portfolio) return -1
    return (a.portfolio?.name ?? '').localeCompare(b.portfolio?.name ?? '')
  })
})

const watchlistByPortfolioFiltered = computed(() => {
  if (!selectedPortfolioId.value) return watchlistByPortfolio.value
  return watchlistByPortfolio.value.filter(s => s.key === selectedPortfolioId.value)
})

const openPortfolioSections = ref(new Set<string>())
function togglePortfolioSection(key: string) {
  if (openPortfolioSections.value.has(key)) openPortfolioSections.value.delete(key)
  else openPortfolioSections.value.add(key)
  openPortfolioSections.value = new Set(openPortfolioSections.value)
}
watchEffect(() => {
  if (watchlist.value.length > 0 && openPortfolioSections.value.size === 0) {
    openPortfolioSections.value = new Set(watchlistByPortfolio.value.map(s => s.key))
  }
})

const hoveredStockId = ref<string | null>(null)
const hoveredCashId = ref<string | null>(null)

// ── Sortierung ──
type SortKey = 'symbol' | 'value' | 'pnl' | 'change'
const stockSortKey = ref<SortKey | null>(null)
const stockSortDir = ref<'asc' | 'desc'>('desc')
const stockSortCols = [
  { key: 'symbol' as SortKey, label: 'Symbol' },
  { key: 'value'  as SortKey, label: 'Wert' },
  { key: 'pnl'   as SortKey, label: 'G&V' },
  { key: 'change' as SortKey, label: '%' },
]

function toggleSort(key: SortKey) {
  if (stockSortKey.value === key) {
    stockSortDir.value = stockSortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    stockSortKey.value = key
    stockSortDir.value = 'desc'
  }
}

function sortGroups(groups: WatchlistGroup[]) {
  if (!stockSortKey.value) return groups
  return [...groups].sort((a, b) => {
    let va = 0, vb = 0
    if (stockSortKey.value === 'symbol') {
      const r = a.symbol.localeCompare(b.symbol)
      return stockSortDir.value === 'asc' ? r : -r
    }
    if (stockSortKey.value === 'value') {
      va = a.totalShares && a.price != null ? convert(a.totalShares * a.price, a.currency) : 0
      vb = b.totalShares && b.price != null ? convert(b.totalShares * b.price, b.currency) : 0
    } else if (stockSortKey.value === 'pnl') {
      va = groupStockPnl(a)
      vb = groupStockPnl(b)
    } else if (stockSortKey.value === 'change') {
      va = a.changePercent ?? 0
      vb = b.changePercent ?? 0
    }
    return stockSortDir.value === 'asc' ? va - vb : vb - va
  })
}

const watchlistByPortfolioSorted = computed(() =>
  watchlistByPortfolioFiltered.value.map(section => ({
    ...section,
    groups: sortGroups(section.groups),
  }))
)

// Stock edit modal
const editStockOpen = ref(false)
const editStockLoading = ref(false)
const editStockItem = ref<WatchlistGroup | null>(null)
const editStockTranche = ref<WatchlistTranche | null>(null)
const editStockForm = reactive({ portfolioId: '', shares: '', purchaseDate: '', purchasePrice: '' })

function openEditStock(group: WatchlistGroup, tranche: WatchlistTranche) {
  editStockItem.value = group
  editStockTranche.value = tranche
  editStockForm.portfolioId = tranche.portfolioId ?? 'none'
  editStockForm.shares = tranche.shares != null ? String(tranche.shares) : ''
  editStockForm.purchaseDate = tranche.purchaseDate ?? ''
  editStockForm.purchasePrice = tranche.purchasePrice != null ? String(tranche.purchasePrice) : ''
  editStockOpen.value = true
}

async function saveEditStock() {
  if (!editStockTranche.value) return
  editStockLoading.value = true
  try {
    await $fetch(`/api/stocks/watchlist/${editStockTranche.value.id}`, {
      method: 'PATCH',
      body: {
        shares: editStockForm.shares ? Number(editStockForm.shares) : null,
        purchasePrice: editStockForm.purchasePrice ? Number(editStockForm.purchasePrice) : null,
        purchaseDate: editStockForm.purchaseDate || null,
        portfolioId: editStockForm.portfolioId === 'none' ? null : editStockForm.portfolioId,
      },
    })
    await refreshWatchlist()
    editStockOpen.value = false
  } finally {
    editStockLoading.value = false
  }
}

const removingStockId = ref<string | null>(null)
async function removeFromWatchlist(id: string) {
  const ok = await confirm('Diese Aktienposition wirklich löschen?', 'Position löschen')
  if (!ok) return
  removingStockId.value = id
  try {
    await $fetch(`/api/stocks/watchlist/${id}`, { method: 'DELETE' })
    await refreshWatchlist()
  } finally {
    removingStockId.value = null
  }
}

// ── Aktie / Cash hinzufügen ──
interface StockSearchResult { symbol: string; name: string; exchange: string; type: string }

const addStockOpen = ref(false)
const addModalTab = ref<'stock' | 'cash'>('stock')
const addSearchQuery = ref('')
const addSearchResults = ref<StockSearchResult[]>([])
const addSearchLoading = ref(false)
const addingSymbol = ref<string | null>(null)
const addPortfolioId = computed({
  get: () => _addPortfolioId.value,
  set: (v) => { _addPortfolioId.value = v }
})
const _addPortfolioId = ref<string>('')
const addCashForm = ref({ portfolioId: '', label: '', amount: '', currency: 'CHF' })
const addCashLoading = ref(false)

watch(addStockOpen, (open) => {
  if (open) {
    const first = portfolios.value.find((p: any) => p.portfolioType === 'Aktien')
    _addPortfolioId.value = first?.id ?? 'none'
    addCashForm.value.portfolioId = portfolios.value.find((p: any) => p.portfolioType === 'Aktien')?.id ?? ''
    addModalTab.value = 'stock'
  }
})

async function deleteCash(id: string) {
  const ok = await confirm('Diesen Cash-Eintrag wirklich löschen?', 'Cash löschen')
  if (!ok) return
  await $fetch(`/api/finance/cash/${id}`, { method: 'DELETE' })
  await refreshCash()
}

async function saveCash() {
  if (!addCashForm.value.amount) return
  addCashLoading.value = true
  try {
    await $fetch('/api/finance/cash', {
      method: 'POST',
      body: {
        portfolioId: addCashForm.value.portfolioId || null,
        label: addCashForm.value.label,
        amount: addCashForm.value.amount,
        currency: addCashForm.value.currency,
      },
    })
    await refreshCash()
    addStockOpen.value = false
    addCashForm.value = { portfolioId: portfolios.value.find((p: any) => p.portfolioType === 'Aktien')?.id ?? '', label: '', amount: '', currency: 'CHF' }
  } finally {
    addCashLoading.value = false
  }
}
let addSearchTimeout: ReturnType<typeof setTimeout> | null = null

function onAddSearchInput() {
  if (addSearchTimeout) clearTimeout(addSearchTimeout)
  if (!addSearchQuery.value.trim()) { addSearchResults.value = []; return }
  addSearchTimeout = setTimeout(async () => {
    addSearchLoading.value = true
    try {
      addSearchResults.value = await $fetch<StockSearchResult[]>(`/api/stocks/search?q=${encodeURIComponent(addSearchQuery.value)}`)
    } catch { addSearchResults.value = [] } finally { addSearchLoading.value = false }
  }, 350)
}

async function addStockToWatchlist(result: StockSearchResult) {
  addingSymbol.value = result.symbol
  try {
    const portfolioId = addPortfolioId.value === 'none' ? null : addPortfolioId.value
    const { id } = await $fetch<{ id: string }>('/api/stocks/watchlist', { method: 'POST', body: { ...result, portfolioId } })
    await refreshWatchlist()
    addStockOpen.value = false
    addSearchQuery.value = ''
    addSearchResults.value = []
    const group = watchlist.value.find(g => g.symbol === result.symbol)
    const tranche = group?.tranches.find(t => t.id === id)
    if (group && tranche) openEditStock(group, tranche)
  } finally { addingSymbol.value = null }
}

// ── Dividenden ──
const { data: dividendsData, pending: dividendsPending } = await useFetch<any[]>(
  () => selectedPortfolioId.value ? `/api/stocks/dividends?portfolioId=${selectedPortfolioId.value}` : '/api/stocks/dividends',
  { watch: [selectedPortfolioId] }
)
const dividends = computed(() => dividendsData.value ?? [])
const totalDividendChf = computed(() =>
  dividends.value.reduce((s: number, d: any) => s + convert(d.annualDividend ?? 0, d.currency) * dividendTaxFactor.value, 0)
)
const dividendAvgYield = computed(() => {
  const withYield = dividends.value.filter((d: any) => d.yield)
  if (!withYield.length) return 0
  return withYield.reduce((s: number, d: any) => s + d.yield, 0) / withYield.length
})
</script>

<style scoped>
/* ── CSS Variables ── */
:global(:root) {
  --f-bg: rgba(30, 58, 95, 0.07);
  --f-card-bg: #f1f4f8;
  --f-card-shadow: -8px -8px 18px rgba(255,255,255,0.9), 8px 8px 18px rgba(150,170,200,0.35);
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
  grid-auto-rows: 600px;
  gap: 20px;
  align-items: stretch;
}


@media (max-width: 1024px) {
  .aktien-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .aktien-grid { grid-template-columns: 1fr; }
}

/* ── Broker Stack (content styles — structural CSS in FinanceBrokerStack.vue) ── */
.broker-stack {
  box-shadow: var(--f-broker-stack-shadow);
}


.broker-bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-top: auto;
}

.broker-name {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.03em;
  text-transform: uppercase;
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
  background: #1e3a5f;
  color: #c8ff57;
}

.badge-negative {
  background: #1e3a5f;
  color: #ff6b6b;
}

/* ── Metall-Positionen ── */
.metal-positions-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.metal-pos-scroll {
  max-height: 400px;
}

.metal-pos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metal-pos-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--f-text);
  opacity: 0.4;
}

.metal-pos-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--f-text);
  opacity: 0.3;
}

.metal-pos-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}


.metal-group-wrap {
  overflow: hidden;
}

.metal-group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.metal-group-header:hover {
  background: rgba(0,0,0,0.03);
}

.dark .metal-group-header:hover {
  background: rgba(255,255,255,0.04);
}

.metal-group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--f-text);
}

.metal-group-count {
  font-size: 11px;
  background: rgba(0,0,0,0.07);
  color: var(--f-text-muted);
  border-radius: 20px;
  padding: 1px 7px;
}

.dark .metal-group-count {
  background: rgba(255,255,255,0.08);
}

.metal-group-total {
  font-size: 13px;
  font-weight: 600;
  color: var(--f-text);
}

.metal-group-chevron {
  width: 14px;
  height: 14px;
  color: var(--f-text-muted);
  flex-shrink: 0;
}

.metal-group-body {}

.metal-pos-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background 0.15s ease;
}

.metal-pos-row:hover {
  background: rgba(0,0,0,0.04);
}

.dark .metal-pos-row:hover {
  background: rgba(255,255,255,0.04);
}

.metal-pos-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.metal-pos-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.metal-pos-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--f-text);
}

.metal-pos-qty {
  font-size: 11px;
  color: var(--f-text-muted);
}

.metal-pos-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.metal-pos-value-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metal-pos-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--f-text);
}

.metal-pos-pnl {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 20px;
}

.pnl-positive { background: rgba(34,197,94,0.12); color: #16a34a; }
.pnl-negative { background: rgba(239,68,68,0.12); color: #dc2626; }

.dark .pnl-positive { color: #4ade80; }
.dark .pnl-negative { color: #f87171; }

.metal-pos-row-clickable { cursor: pointer; }


.metal-tranchen {
  border-left: 2px solid rgba(0,0,0,0.08);
  margin-left: 22px;
}

.dark .metal-tranchen {
  border-color: rgba(255,255,255,0.08);
}

.metal-tranche-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  transition: background 0.15s ease;
}

.metal-tranche-row:hover {
  background: rgba(0,0,0,0.03);
}

.dark .metal-tranche-row:hover {
  background: rgba(255,255,255,0.04);
}

.metal-tranche-row:hover .metal-pos-edit { opacity: 1; }

.metal-tranche-date {
  font-size: 10px;
  color: var(--f-text-muted);
}

.metal-pos-empty {
  font-size: 13px;
  color: var(--f-text-muted);
  text-align: center;
  padding: 24px 0;
}

.broker-total {
  background: #1e3a5f;
  padding: 14px;
  font-size: 18px;
  font-weight: 300;
  color: #c8ff57;
  letter-spacing: -0.5px;
  text-align: right;
  transition: filter 0.2s ease;
}

.broker-total { margin-top: auto; }
.broker-total:hover { filter: brightness(1.35); }

.broker-total-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.broker-total-icon {
  width: 18px;
  height: 18px;
  color: #c8ff57;
  opacity: 0.6;
}

/* ── Edelmetalle Grid ── */
.edelmetalle-grid {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-auto-rows: 600px;
  gap: 20px;
  align-items: stretch;
}

@media (max-width: 640px) {
  .edelmetalle-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Pill Card ── */
.pill-card {
  border-radius: 28px;
  background: #1e3a5f;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 8px 8px 24px rgba(0,0,0,0.18), -4px -4px 16px rgba(255,255,255,0.06);
}

.pill-header {
  display: flex;
  justify-content: flex-end;
}

.pill-period-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.20);
  border-radius: 999px;
  padding: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.06);
}

.period-options {
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}

.period-options-visible {
  max-width: 280px;
  opacity: 1;
}

.pill-body {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;
}

.pill-cards-row {
  display: grid;
  grid-template-columns: repeat(2, 120px);
  gap: 20px;
  flex-shrink: 0;
}

@media (min-width: 900px) {
  .pill-cards-row { grid-template-columns: repeat(5, 120px); }
}

.pill-right {
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 4px;
  text-align: right;
}

.pill-change { font-size: 12px; font-weight: 600; }

.pill-total {
  font-size: 36px;
  font-weight: 100;
  letter-spacing: -1.5px;
  line-height: 1;
}

.pill-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pill-circle-up {}
.pill-circle-down {}

.pill-circle-icon {
  width: 22px;
  height: 22px;
}

.period-btn {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 11px;
  border-radius: 999px;
  transition: background 0.15s ease, color 0.15s ease;
  letter-spacing: 0.03em;
}

.period-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
}

.period-btn-active {
  color: #1e3a5f;
  background: #ffffff;
}

.period-active-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  padding: 0 8px 0 4px;
  letter-spacing: 0.03em;
}

@media (min-width: 1024px) {
  .pill-cards-row { grid-template-columns: repeat(5, 120px); }
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
  background: #1e3a5f !important;
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

.dividend-tax-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(200,255,87,0.08);
  color: #c8ff57;
  opacity: 0.35;
  transition: opacity 0.2s, background 0.2s;
  cursor: pointer;
}

.dividend-tax-toggle:hover { opacity: 0.6; }

.dividend-tax-toggle--active {
  opacity: 1;
  background: rgba(200,255,87,0.2);
}

.dividend-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8ff57;
}

.dividend-list {
  margin-top: 4px;
  max-height: 120px;
  margin-left: -20px;
  margin-right: -20px;
  padding-left: 20px;
}

.dividend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 20px 2px 0;
  border-top: 1px solid rgba(200,255,87,0.08);
}

.dividend-sym {
  font-size: 11px;
  font-weight: 600;
  color: #c8ff57;
  opacity: 0.7;
}

.dividend-row-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dividend-row-pct {
  font-size: 10px;
  color: #c8ff57;
  opacity: 0.5;
}

.dividend-val {
  font-size: 11px;
  color: #c8ff57;
  opacity: 0.85;
}

.dividend-empty {
  font-size: 11px;
  color: #c8ff57;
  opacity: 0.4;
  text-align: center;
  margin-top: 8px;
}

/* ── Skeleton Loaders ── */
.card-skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  flex: 1;
}

.row-skeleton {
  height: 36px;
  border-radius: 10px;
}

.pill-skeleton-mini {
  height: 80px;
  border-radius: 14px;
  flex: 1;
  opacity: 0.25;
}

.pill-skeleton-change {
  height: 18px;
  width: 180px;
  border-radius: 8px;
  opacity: 0.25;
}

.pill-skeleton-total {
  height: 36px;
  width: 220px;
  border-radius: 10px;
  opacity: 0.25;
}

.dividend-skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.dividend-skeleton-amount {
  height: 32px;
  border-radius: 8px;
  opacity: 0.2;
}

.dividend-skeleton-sub {
  height: 16px;
  width: 60%;
  border-radius: 6px;
  opacity: 0.15;
}

.dividend-skeleton-row {
  height: 20px;
  border-radius: 6px;
  opacity: 0.12;
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

/* ── Aktien Positionen ── */
.stock-positions-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.add-portfolio-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.12);
  font-size: 12px;
  font-weight: 500;
  color: var(--f-text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dark .add-portfolio-pill {
  border-color: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
}
.add-portfolio-pill:hover {
  background: rgba(0,0,0,0.05);
}
.dark .add-portfolio-pill:hover {
  background: rgba(255,255,255,0.06);
}
.add-portfolio-pill-active {
  background: rgba(0,0,0,0.08);
  color: var(--f-text);
  border-color: rgba(0,0,0,0.2);
}
.dark .add-portfolio-pill-active {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-color: rgba(255,255,255,0.2);
}
.add-portfolio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stock-sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--f-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.stock-sort-btn:hover {
  background: rgba(0,0,0,0.05);
}
.dark .stock-sort-btn:hover {
  background: rgba(255,255,255,0.06);
}
.stock-sort-btn-active {
  color: var(--f-text);
  background: rgba(0,0,0,0.07);
}
.dark .stock-sort-btn-active {
  color: #fff;
  background: rgba(255,255,255,0.1);
}

.stock-pos-header {
  display: grid;
  grid-template-columns: 1fr 130px 90px 64px 56px;
  align-items: center;
  gap: 4px;
  padding: 10px 6px 8px 28px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

:global(.dark) .stock-pos-header {
  border-bottom-color: rgba(255,255,255,0.06);
}

.stock-sort-btn--left {
  justify-content: flex-start;
}

.stock-sort-btn--right {
  justify-content: flex-end;
  width: 100%;
}

.stock-header-plus {
  display: flex;
  justify-content: flex-end;
}

.stock-pos-scroll {
  flex: 1;
  min-height: 0;
}

.stock-pos-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-group-wrap {
  overflow: hidden;
}

.stock-pos-empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--f-text-muted);
}

.stock-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.stock-section-header:hover {
  background: rgba(0,0,0,0.03);
}

.stock-section-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stock-section-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--f-text);
}

.stock-section-count {
  font-size: 11px;
  color: var(--f-text-muted);
  background: rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 1px 7px;
}

.stock-section-chevron {
  width: 14px;
  height: 14px;
  color: var(--f-text-muted);
}

.stock-section-body {
  display: flex;
  flex-direction: column;
}

/* ── Spalten-Grid: Info | Wert | G&V | % | Actions ── */
.stock-col-header,
.stock-pos-row,
.stock-tranche-row {
  display: grid;
  grid-template-columns: 1fr 130px 90px 64px 56px;
  align-items: center;
  gap: 4px;
}

.stock-col-header {
  padding: 4px 6px 4px 28px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

:global(.dark) .stock-col-header {
  border-bottom-color: rgba(255,255,255,0.06);
}

.stock-col-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--f-text-muted);
  text-align: right;
}

.stock-pos-row {
  padding: 8px 6px 8px 28px;
  transition: background 0.12s;
}

.stock-pos-row:hover {
  background: rgba(0,0,0,0.03);
}

.stock-pos-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stock-pos-symbol {
  font-size: 13px;
  font-weight: 600;
  color: var(--f-text);
}

.stock-pos-name-txt {
  font-size: 11px;
  color: var(--f-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-col-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--f-text);
  text-align: right;
}

.stock-col-pnl {
  font-size: 12px;
  font-weight: 500;
  text-align: right;
}

.stock-col-change {
  font-size: 12px;
  font-weight: 500;
  text-align: right;
}

.stock-pos-currency {
  font-size: 10px;
  font-weight: 400;
  color: var(--f-text-muted);
}

.stock-pos-orig-currency {
  display: block;
  font-size: 10px;
  font-weight: 400;
  color: var(--f-text-muted);
  opacity: 0.6;
}

.stock-col-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;
}

.stock-col-actions--visible {
  opacity: 1;
}

.stock-pos-qty {
  font-size: 11px;
  color: var(--f-text-muted);
}

.stock-tranchen {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(0,0,0,0.04);
  background: rgba(0,0,0,0.02);
}

.stock-tranche-row {
  padding: 5px 6px 5px 36px;
  transition: background 0.12s;
}

.stock-tranche-row:hover {
  background: rgba(0,0,0,0.03);
}

.cash-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.cash-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cash-card-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--f-text-muted);
}

.cash-card-total {
  font-size: 22px;
  font-weight: 300;
  color: var(--f-text);
}

.cash-empty {
  font-size: 13px;
  color: var(--f-text-muted);
  text-align: center;
  padding: 16px 0;
}

.cash-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cash-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
  transition: background 0.12s;
}

:global(.dark) .cash-entry {
  background: rgba(255,255,255,0.04);
}

.cash-entry:hover {
  background: rgba(0,0,0,0.06);
}

:global(.dark) .cash-entry:hover {
  background: rgba(255,255,255,0.07);
}

.cash-entry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cash-entry-portfolio {
  font-size: 13px;
  font-weight: 600;
  color: var(--f-text);
}

.cash-entry-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cash-entry-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--f-text);
}

.cash-entry-curr {
  font-size: 10px;
  color: var(--f-text-muted);
}

.cash-entry-converted {
  font-size: 11px;
  color: var(--f-text-muted);
  margin-left: 4px;
}

.cash-entry-actions {
  opacity: 0;
  transition: opacity 0.12s;
}

.cash-entry-actions--visible {
  opacity: 1;
}
</style>

<style>
/* ── Broker-Stack Slot-Klassen (nicht scoped) ── */
.broker-name {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.broker-bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-top: auto;
}

.broker-value {
  font-size: 22px;
  font-weight: 300;
  color: rgba(255,255,255,0.92);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.broker-cash-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  color: rgba(200, 255, 87, 0.8);
  margin-bottom: 4px;
}

/* ── OverlayScrollbars custom theme ── */
.stock-pos-scroll,
.metal-pos-scroll {
  --os-size: 4px;
  --os-padding-perpendicular: 2px;
  --os-padding-axis: 4px;
  --os-track-bg: transparent;
  --os-handle-bg: rgba(100, 130, 170, 0.25);
  --os-handle-bg-hover: rgba(100, 130, 170, 0.5);
  --os-handle-bg-active: rgba(100, 130, 170, 0.7);
  --os-handle-border-radius: 4px;
}

.dark .stock-pos-scroll,
.dark .metal-pos-scroll {
  --os-handle-bg: rgba(200, 220, 255, 0.15);
  --os-handle-bg-hover: rgba(200, 220, 255, 0.35);
  --os-handle-bg-active: rgba(200, 220, 255, 0.55);
}

.dividend-list {
  --os-size: 3px;
  --os-padding-perpendicular: 0px;
  --os-padding-axis: 3px;
  --os-track-bg: transparent;
  --os-handle-bg: #c8ff57;
  --os-handle-bg-hover: #c8ff57;
  --os-handle-bg-active: #c8ff57;
  --os-handle-border-radius: 4px;
}
</style>
