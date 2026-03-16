<template>
  <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom' }">
    <slot :formatted="formatted">
      <div class="flex items-center w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors">
        <input
          v-model="displayValue"
          type="text"
          placeholder="TT.MM.JJJJ"
          maxlength="10"
          class="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
          @input="onInput"
          @blur="commitInput"
          @keydown.enter.prevent="commitInput"
        />
        <button
          type="button"
          class="px-2.5 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          @click.stop="open = !open"
        >
          <UIcon name="i-lucide-calendar" class="w-4 h-4" />
        </button>
      </div>
    </slot>

    <template #content>
      <div class="p-3 w-64 select-none" @mouseleave="hoverDate = ''">
        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
            @click="prevMonth"
          >
            <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
          </button>
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ monthLabel }}</span>
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
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
            class="h-8 flex items-center justify-center"
            @mouseenter="hoverDate = cell.date"
          >
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center text-xs font-medium rounded-full transition-all"
              :class="dayClass(cell)"
              :disabled="!cell.inMonth"
              @click="selectDay(cell.date)"
            >{{ cell.day }}</button>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            type="button"
            class="text-xs text-gray-400 hover:text-red-500 transition-colors"
            @click="clear"
          >Löschen</button>
          <button
            type="button"
            class="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
            @click="selectToday"
          >Heute</button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  'select': [string]
}>()

const open = ref(false)
const hoverDate = ref('')

const today = new Date()
function toLocalStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const todayStr = toLocalStr(today)

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

// --- Text input display ---
const displayValue = ref('')

watch(() => props.modelValue, (v) => {
  if (v) {
    const d = new Date(v + 'T00:00:00')
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
    displayValue.value = toDisplayStr(v)
  } else {
    displayValue.value = ''
  }
}, { immediate: true })

function toDisplayStr(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function onInput() {
  // Auto-insert dots after day and month
  let v = displayValue.value.replace(/[^\d.]/g, '')
  const digits = v.replace(/\./g, '')
  if (digits.length > 2 && !v.includes('.')) {
    v = digits.slice(0, 2) + '.' + digits.slice(2)
  }
  if (digits.length > 4 && v.indexOf('.', 3) === -1) {
    const parts = v.split('.')
    v = parts[0] + '.' + parts[1].slice(0, 2) + '.' + (parts[1].slice(2) + (parts[2] ?? ''))
  }
  displayValue.value = v
}

function commitInput() {
  const v = displayValue.value.trim()
  if (!v) {
    emit('update:modelValue', '')
    emit('select', '')
    return
  }
  // Accept DD.MM.YYYY or DD.MM.YY
  const match = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (!match) return
  let [, d, m, y] = match
  if (y.length === 2) y = '20' + y
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  const date = new Date(iso + 'T00:00:00')
  if (isNaN(date.getTime())) return
  displayValue.value = toDisplayStr(iso)
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
  emit('update:modelValue', iso)
  emit('select', iso)
}

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

interface Cell { date: string; day: number; inMonth: boolean; isToday: boolean; isWeekend: boolean }

const cells = computed<Cell[]>(() => {
  const result: Cell[] = []
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const last = new Date(viewYear.value, viewMonth.value + 1, 0)
  const offset = (first.getDay() + 6) % 7
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value, -i)
    result.push({ date: toLocalStr(d), day: d.getDate(), inMonth: false, isToday: false, isWeekend: false })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(viewYear.value, viewMonth.value, d)
    const str = toLocalStr(dt)
    result.push({ date: str, day: d, inMonth: true, isToday: str === todayStr, isWeekend: dt.getDay() === 0 || dt.getDay() === 6 })
  }
  const rem = (7 - (result.length % 7)) % 7
  for (let d = 1; d <= rem; d++) {
    const dt = new Date(viewYear.value, viewMonth.value + 1, d)
    result.push({ date: toLocalStr(dt), day: d, inMonth: false, isToday: false, isWeekend: false })
  }
  return result
})

function dayClass(cell: Cell): string {
  if (!cell.inMonth) return 'text-gray-300 dark:text-gray-600 cursor-default'
  if (cell.date === props.modelValue) return 'bg-primary-500 text-white shadow-sm scale-105'
  if (cell.isToday) return 'ring-1 ring-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950'
  if (cell.isWeekend) return 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
  return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
}

function selectDay(date: string) {
  displayValue.value = toDisplayStr(date)
  emit('update:modelValue', date)
  emit('select', date)
  open.value = false
}

function selectToday() {
  selectDay(todayStr)
}

function clear() {
  displayValue.value = ''
  emit('update:modelValue', '')
  emit('select', '')
  open.value = false
}

const formatted = computed(() => {
  if (!props.modelValue) return 'Datum wählen'
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(props.modelValue + 'T00:00:00'))
})
</script>
