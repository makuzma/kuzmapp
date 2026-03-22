<template>
  <div
    class="pill-period-wrap"
    :class="{ 'pill-period-expanded': expanded }"
    style="cursor:pointer"
    @click="expanded = !expanded"
  >
    <div class="period-options" :class="{ 'period-options-visible': expanded }">
      <button
        v-for="p in periods"
        :key="p"
        class="period-btn font-[SUSE_Mono]"
        :class="modelValue === p ? 'period-btn-active' : ''"
        @click.stop="select(p)"
      >{{ p }}</button>
    </div>
    <span v-if="!expanded" class="period-active-label font-[SUSE_Mono]">{{ modelValue }}</span>
    <div class="pill-circle" :class="trend >= 0 ? 'pill-circle-up' : 'pill-circle-down'">
      <UIcon
        :name="trend >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
        class="pill-circle-icon"
        :class="trend >= 0 ? 'text-green-500' : 'text-red-700'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const periods = ['1D', '1W', '1M', 'YTD', '1Y'] as const
type Period = typeof periods[number]

const props = defineProps<{
  modelValue: Period
  trend: number
}>()

const emit = defineEmits<{
  'update:modelValue': [period: Period]
}>()

const expanded = ref(false)

function select(p: Period) {
  emit('update:modelValue', p)
  expanded.value = false
}
</script>

<style scoped>
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

.pill-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pill-circle-icon {
  width: 22px;
  height: 22px;
}
</style>
