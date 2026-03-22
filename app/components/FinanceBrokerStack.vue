<template>
  <div class="broker-stack" :class="{ 'broker-stack--collapsed': collapsed }">
    <div class="broker-sections-wrap" :class="{ 'broker-sections-wrap--collapsed': collapsed }">
      <div
        v-for="section in sections"
        :key="section.id"
        class="broker-section"
        :class="section.extraClass"
        :style="{ background: section.color, height: collapsed ? '22px' : (visible ? section.height : '0px'), cursor: 'pointer', flexShrink: 0 }"
        @click="onSectionClick(section.id)"
      >
        <div class="broker-section-content" :class="{ 'broker-section-content--blurred': selectedId && section.id !== selectedId, 'broker-section-content--hidden': collapsed }">
          <slot name="section" :section="section">
            <div class="broker-name">{{ section.label }}</div>
            <div class="broker-bottom">
              <div class="broker-value font-[SUSE_Mono]">
                <FlipNumber :value="Math.round(section.value).toLocaleString('de-CH')" />
              </div>
            </div>
          </slot>
        </div>
      </div>
      <Transition name="breakdown">
        <OverlayScrollbarsComponent
          v-if="collapsed && $slots['collapsed-view']"
          :options="{ scrollbars: { autoHide: 'scroll', autoHideDelay: 600 } }"
          class="broker-collapsed-overlay"
          defer
        >
          <slot name="collapsed-view" />
        </OverlayScrollbarsComponent>
      </Transition>
    </div>
    <div class="broker-total font-[SUSE_Mono]" @click="$emit('reset')">
      <div v-if="cashTotal != null && cashTotal > 0" class="broker-total-cash">
        <UIcon name="i-lucide-banknote" class="broker-total-cash-icon" />
        <span>{{ Math.round(cashTotal).toLocaleString('de-CH') }}</span>
        <span v-if="cashPercent != null" class="broker-total-cash-pct">{{ cashPercent.toFixed(1) }}%</span>
      </div>
      <div class="broker-total-row">
        <button class="btn-morphic" :class="{ 'btn-morphic--pressed': collapsed }" @click.stop="collapsed = !collapsed">
          <UIcon v-if="icon" :name="icon" class="broker-collapse-btn-icon" />
        </button>
        <FlipNumber :value="Math.round(totalValue).toLocaleString('de-CH')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'

interface Section {
  id: string
  color: string
  height: string
  label: string
  value: number
  extraClass?: string
}

defineProps<{
  sections: Section[]
  totalValue: number
  visible: boolean
  icon?: string
  cashTotal?: number
  cashPercent?: number
  selectedId?: string | null
}>()

const collapsed = ref(false)

const emit = defineEmits<{ select: [id: string]; reset: []; collapse: [value: boolean] }>()

function onSectionClick(id: string) {
  if (collapsed.value) collapsed.value = false
  emit('select', id)
}

watch(collapsed, v => emit('collapse', v))
</script>

<style scoped>
.broker-stack {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #1e3a5f;
  box-shadow: var(--f-broker-stack-shadow);
}

.broker-sections-wrap {
  position: absolute;
  inset: 0;
  bottom: 50px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #1e3a5f;
  overflow: visible;
  border-radius: 16px;
}

.broker-section {
  padding: 12px 14px;
  display: block;
  border-radius: 16px;
  position: relative;
  margin-bottom: -12px;
  min-height: 0;
  transition: height 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.broker-section:hover { filter: brightness(1.12); }

.broker-section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition: filter 0.3s ease, opacity 0.3s ease;
}
.broker-section-content--blurred {
  filter: blur(2px);
  opacity: 0.6;
}
.broker-section-content--hidden {
  opacity: 0;
  pointer-events: none;
}
.broker-section:first-child { z-index: 3; border-radius: 0 16px 16px 16px; overflow: hidden; }
.broker-section:nth-child(2) { z-index: 2; border-radius: 0 0 16px 16px; }
.broker-section:nth-child(3) { z-index: 1; border-radius: 0 0 16px 16px; }
.broker-section:nth-child(4) { z-index: 0; border-radius: 0 0 16px 16px; }

.broker-total {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: transparent;
  padding: 8px 14px 10px;
  font-size: 18px;
  font-weight: 300;
  color: #c8ff57;
  letter-spacing: -0.5px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
  transition: filter 0.2s ease, height 0.7s cubic-bezier(0.4, 0, 0.2, 1), padding 0.5s ease;
}
.broker-total:hover { filter: brightness(1.35); }

.broker-total-cash {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  color: rgba(200,255,87,0.6);
  letter-spacing: 0;
}

.broker-total-cash-icon {
  width: 11px;
  height: 11px;
}

.broker-total-cash-pct {
  opacity: 0.75;
}

.broker-total-row {
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

.broker-collapse-btn-icon {
  width: 14px;
  height: 14px;
  color: #1e3a5f;
}

/* ── Collapsed overlay ── */
.broker-sections-wrap--collapsed {
  overflow: hidden;
}
.broker-collapsed-overlay {
  flex: 1;
  padding: 50px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  min-height: 0;
}

.breakdown-enter-active, .breakdown-leave-active { transition: opacity 0.3s ease; }
.breakdown-enter-from, .breakdown-leave-to { opacity: 0; }

/* ── Default slot content ── */
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
  position: absolute;
  bottom: 12px;
  right: 14px;
  left: 14px;
  width: auto;
}

.broker-value {
  font-size: 22px;
  font-weight: 300;
  color: rgba(255,255,255,0.92);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

/* ── Metal section (structural) ── */
.broker-section.metal-section {
  overflow: hidden;
  min-height: 0;
  transition: height 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease;
}
.broker-section.metal-section:hover { filter: brightness(1.12); }
</style>

<!-- Global (non-scoped) for cross-slot metal sheen effects -->
<style>
.metal-sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
}
.metal-sheen::before {
  content: '';
  position: absolute;
  top: -60%; left: -80%;
  width: 55%; height: 220%;
  background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.08) 70%, transparent 100%);
  transform: skewX(-15deg);
  animation: none;
}
.metal-sheen::after {
  content: '';
  position: absolute;
  top: -60%; left: -80%;
  width: 25%; height: 220%;
  background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
  transform: skewX(-15deg);
  animation: none;
}
.metal-section:hover .metal-sheen::before { animation: sheen-slide 0.7s ease-out forwards; }
.metal-section:hover .metal-sheen::after  { animation: sheen-slide 0.7s ease-out forwards 0.12s; }
.metal-gold:hover .metal-sheen::before    { animation: sheen-slide 1.6s ease-in-out forwards; }
.metal-gold:hover .metal-sheen::after     { animation: sheen-slide 1.6s ease-in-out forwards 0.3s; }
@keyframes sheen-slide { 0% { left: -80%; } 100% { left: 140%; } }

.metal-gold   .metal-sheen::before, .metal-gold:hover   .metal-sheen::before { background: linear-gradient(105deg, transparent 0%, rgba(255,240,150,0.1) 30%, rgba(255,255,220,0.55) 50%, rgba(255,240,150,0.1) 70%, transparent 100%); }
.metal-gold   .metal-sheen::after,  .metal-gold:hover   .metal-sheen::after  { background: linear-gradient(105deg, transparent 0%, rgba(255,250,180,0.25) 50%, transparent 100%); }
.metal-silver .metal-sheen::before, .metal-silver:hover .metal-sheen::before { background: linear-gradient(105deg, transparent 0%, rgba(210,230,255,0.1) 30%, rgba(240,248,255,0.6) 50%, rgba(210,230,255,0.1) 70%, transparent 100%); }
.metal-platinum .metal-sheen::before, .metal-platinum:hover .metal-sheen::before { background: linear-gradient(105deg, transparent 0%, rgba(180,210,240,0.1) 30%, rgba(220,240,255,0.55) 50%, rgba(180,210,240,0.1) 70%, transparent 100%); }
</style>
