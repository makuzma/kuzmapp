<template>
  <UButton
    variant="ghost"
    color="neutral"
    :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
    @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
  />
</template>

<script setup lang="ts">
const colorMode = useColorMode()
</script>
