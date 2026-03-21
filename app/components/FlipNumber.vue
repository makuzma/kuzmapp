<template>
  <span class="flip-num" :class="{ 'flip-num--scrambling': scrambling }">
    <span v-for="(ch, i) in displayChars" :key="i" class="flip-ch">{{ ch }}</span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ value: string }>()

const DIGITS = '0123456789'
const DURATION = 500
const FRAME = 45

const displayChars = ref<string[]>(props.value.split(''))
const scrambling = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function rand() {
  return DIGITS[Math.floor(Math.random() * 10)]
}

function scramble(target: string) {
  if (timer) clearInterval(timer)
  const targetChars = target.split('')
  scrambling.value = true
  const start = Date.now()

  timer = setInterval(() => {
    const elapsed = Date.now() - start
    if (elapsed >= DURATION) {
      clearInterval(timer!)
      timer = null
      displayChars.value = targetChars
      scrambling.value = false
      return
    }
    displayChars.value = targetChars.map(ch => /\d/.test(ch) ? rand() : ch)
  }, FRAME)
}

watch(() => props.value, scramble)
onMounted(() => { displayChars.value = props.value.split('') })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.flip-num {
  display: inline-flex;
  align-items: baseline;
}

.flip-ch {
  display: inline-block;
}
</style>
