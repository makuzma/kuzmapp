<template>
  <UModal
    v-model:open="confirmOpen"
    :ui="{
      overlay: 'bg-[#0a1628]/60 backdrop-blur-md',
      content: 'bg-white/80 dark:bg-[#0f1e33]/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 ring-0',
      header: 'border-b border-white/20 dark:border-white/10',
      footer: 'border-t border-white/20 dark:border-white/10',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
          <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-500" />
        </div>
        <h2 class="font-instrument italic text-[1.6rem] text-gray-900 dark:text-white">{{ confirmTitle }}</h2>
      </div>
    </template>
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">{{ confirmMessage }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="onCancel">Abbrechen</UButton>
        <UButton color="error" icon="i-lucide-trash-2" @click="onConfirm">Löschen</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { confirmOpen, confirmTitle, confirmMessage, onConfirm, onCancel } = useConfirm()
</script>
