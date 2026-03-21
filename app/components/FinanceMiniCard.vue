<template>
  <div class="mini-card" :style="{ boxShadow: shadow }">
    <div class="mini-header">
      <span class="mini-title">{{ label }}</span>
      <UIcon
        name="i-lucide-triangle"
        class="w-2.5 h-2.5"
        :class="change >= 0 ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'"
      />
    </div>
    <div v-show="change !== 0" class="mini-change font-suse-mono" :class="change >= 0 ? 'text-green-500' : 'text-red-500'">
      {{ change >= 0 ? '+' : '' }}{{ change.toFixed(1) }}%
      {{ Math.abs(Math.round(value * change / 100)).toLocaleString('de-CH') }} CHF
    </div>
    <div class="mini-bar-track">
      <div class="mini-bar-fill" :style="{ width: progress + '%', background: color }" />
    </div>
    <div class="mini-value font-suse-mono">{{ value.toLocaleString('de-CH') }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: number
  change: number
  progress: number
  color: string
  shadow: string
}>()
</script>

<style scoped>
.mini-card {
  background: linear-gradient(145deg, #ffffff 0%, #f4f6fa 60%, #ffffff 100%);
  border-radius: 16px;
  padding: 14px;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

:global(.dark) .mini-card {
  background: linear-gradient(145deg, #1e2d38 0%, #182530 60%, #1e2d38 100%);
}

.mini-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-title {
  font-size: 12px;
  font-weight: 700;
  color: #1a1a2e;
}

:global(.dark) .mini-title { color: #d1d5db; }

.mini-change {
  font-size: 10px;
  font-weight: 600;
}

.mini-bar-track {
  height: 6px;
  border-radius: 6px;
  background: #e8ecf1;
  box-shadow: inset 1px 1px 2px #cdd1d6, inset -1px -1px 2px #ffffff;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.mini-value {
  font-size: 20px;
  font-weight: 300;
  color: #1a1a2e;
  letter-spacing: -0.5px;
  line-height: 1;
}

:global(.dark) .mini-value { color: #d1d5db; }
</style>
