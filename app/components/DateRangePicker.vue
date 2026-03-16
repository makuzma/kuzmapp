<template>
  <div class="select-none" @mouseleave="hoverDate = ''">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-3">
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        @click="prevMonth"
      >
        <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
      </button>
      <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ monthLabel }}</span>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        @click="nextMonth"
      >
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
      </button>
    </div>

    <!-- Weekday headers -->
    <div class="grid grid-cols-7 mb-1">
      <div
        v-for="d in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']"
        :key="d"
        class="text-[10px] font-semibold text-center text-gray-400 uppercase tracking-wider py-1"
      >{{ d }}</div>
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="relative h-8 flex items-center justify-center cursor-pointer"
        :class="bgClass(cell)"
        @click="selectDay(cell.date)"
        @mouseenter="hoverDate = cell.date"
      >
        <span
          class="w-7 h-7 flex items-center justify-center text-xs font-medium rounded-full transition-all z-10 relative"
          :class="textClass(cell)"
        >{{ cell.day }}</span>
      </div>
    </div>

    <!-- Summary bar -->
    <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs min-h-[28px]">
      <template v-if="startDate">
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ fmt(startDate) }}</span>
        <UIcon name="i-lucide-arrow-right" class="w-3 h-3 text-gray-400 shrink-0" />
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ endDate ? fmt(endDate) : '…' }}</span>
        <span v-if="endDate" class="ml-auto text-gray-400 tabular-nums">
          {{ dayCount }} {{ dayCount === 1 ? 'Tag' : 'Tage' }}
        </span>
      </template>
      <span v-else class="text-gray-400">Startdatum wählen</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  startDate: string
  endDate: string
}>()

const emit = defineEmits<{
  'update:startDate': [string]
  'update:endDate': [string]
}>()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const hoverDate = ref('')
const selecting = ref(false)

onMounted(() => {
  if (props.startDate) {
    const d = new Date(props.startDate + 'T00:00:00')
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
)

function toStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface Cell { date: string; day: number; inMonth: boolean; isToday: boolean; isWeekend: boolean }

const cells = computed<Cell[]>(() => {
  const result: Cell[] = []
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const last = new Date(viewYear.value, viewMonth.value + 1, 0)
  const todayStr = toStr(today)

  const offset = (first.getDay() + 6) % 7
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value, -i)
    result.push({ date: toStr(d), day: d.getDate(), inMonth: false, isToday: toStr(d) === todayStr, isWeekend: d.getDay() === 0 || d.getDay() === 6 })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(viewYear.value, viewMonth.value, d)
    result.push({ date: toStr(dt), day: d, inMonth: true, isToday: toStr(dt) === todayStr, isWeekend: dt.getDay() === 0 || dt.getDay() === 6 })
  }
  const rem = (7 - (result.length % 7)) % 7
  for (let d = 1; d <= rem; d++) {
    const dt = new Date(viewYear.value, viewMonth.value + 1, d)
    result.push({ date: toStr(dt), day: d, inMonth: false, isToday: toStr(dt) === todayStr, isWeekend: dt.getDay() === 0 || dt.getDay() === 6 })
  }
  return result
})

function selectDay(date: string) {
  if (!selecting.value || !props.startDate) {
    emit('update:startDate', date)
    emit('update:endDate', '')
    selecting.value = true
  } else {
    let start = props.startDate
    let end = date
    if (end < start) { [start, end] = [end, start] }
    emit('update:startDate', start)
    emit('update:endDate', end)
    selecting.value = false
  }
}

const effectiveEnd = computed(() =>
  selecting.value && hoverDate.value ? hoverDate.value : props.endDate
)

const rangeA = computed(() => {
  const s = props.startDate
  const e = effectiveEnd.value
  if (!s) return ''
  if (!e || e === s) return s
  return s < e ? s : e
})

const rangeB = computed(() => {
  const s = props.startDate
  const e = effectiveEnd.value
  if (!s || !e || e === s) return s || ''
  return s < e ? e : s
})

function bgClass(cell: Cell): string {
  if (!cell.inMonth) return ''
  const a = rangeA.value
  const b = rangeB.value
  if (!a || !b || a === b) return ''

  const between = cell.date > a && cell.date < b
  const isA = cell.date === a
  const isB = cell.date === b

  if (between) return 'bg-primary-50 dark:bg-primary-950/40'
  if (isA) return 'bg-primary-50 dark:bg-primary-950/40 rounded-l-full'
  if (isB) return 'bg-primary-50 dark:bg-primary-950/40 rounded-r-full'
  return ''
}

function textClass(cell: Cell): string {
  if (!cell.inMonth) return 'text-gray-300 dark:text-gray-600 cursor-default'
  const a = rangeA.value
  const b = rangeB.value
  const isEndpoint = (a && cell.date === a) || (b && cell.date === b)

  if (isEndpoint) return 'bg-primary-500 text-white shadow-sm scale-105'
  if (cell.isToday) return 'ring-1 ring-primary-400 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  if (cell.isWeekend) return 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
  return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
}

const dayCount = computed(() => {
  if (!props.startDate || !props.endDate) return 0
  const ms = new Date(props.endDate + 'T00:00:00').getTime() - new Date(props.startDate + 'T00:00:00').getTime()
  return Math.round(ms / 86400000) + 1
})

function fmt(str: string): string {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(str + 'T00:00:00'))
}
</script>
