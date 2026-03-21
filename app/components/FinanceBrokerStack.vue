<template>
  <div class="broker-stack">
    <div class="broker-sections-wrap">
      <div
        v-for="section in sections"
        :key="section.id"
        class="broker-section"
        :class="section.extraClass"
        :style="{ background: section.color, height: visible ? section.height : '0px', cursor: 'pointer' }"
        @click="$emit('select', section.id)"
      >
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
    <div class="broker-total font-[SUSE_Mono]" @click="$emit('reset')">
      <div v-if="cashTotal != null && cashTotal > 0" class="broker-total-cash">
        <UIcon name="i-lucide-banknote" class="broker-total-cash-icon" />
        <span>{{ Math.round(cashTotal).toLocaleString('de-CH') }}</span>
        <span v-if="cashPercent != null" class="broker-total-cash-pct">{{ cashPercent.toFixed(1) }}%</span>
      </div>
      <div class="broker-total-row">
        <UIcon v-if="icon" :name="icon" class="broker-total-icon" />
        <FlipNumber :value="Math.round(totalValue).toLocaleString('de-CH')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
}>()

defineEmits<{
  select: [id: string]
  reset: []
}>()
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 16px;
  position: relative;
  margin-bottom: -12px;
  min-height: 0;
  transition: height 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease;
  overflow: visible;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.broker-section:hover { filter: brightness(1.12); }
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
  transition: filter 0.2s ease;
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
  margin-top: auto;
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
