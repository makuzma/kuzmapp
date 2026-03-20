<template>
  <div class="p-6 animate-pulse">
    <div class="max-w-[1600px] mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div class="space-y-2">
            <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-4 w-64 rounded bg-gray-100 dark:bg-gray-700" />
          </div>
        </div>
        <div class="text-right space-y-2">
          <div class="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700 ml-auto" />
          <div class="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800 ml-auto" />
          <div class="h-3 w-8 rounded bg-gray-100 dark:bg-gray-700 ml-auto" />
        </div>
      </div>

      <!-- Portfolio Widget -->
      <div class="space-y-3">
        <div class="h-16 w-72 rounded bg-gray-200 dark:bg-gray-800" />
        <div class="flex gap-3">
          <div v-for="i in 3" :key="i" class="flex-1 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
            <div class="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="shrink-0 space-y-2 pb-1 text-right">
            <div class="h-10 w-28 rounded bg-gray-200 dark:bg-gray-800 ml-auto" />
            <div class="h-3 w-8 rounded bg-gray-100 dark:bg-gray-700 ml-auto" />
          </div>
        </div>
      </div>

      <!-- Card 1: Edelmetalle -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="h-7 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div class="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="space-y-2">
            <div class="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            <div class="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            <div class="h-3 w-12 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </div>

      <!-- Card 2: Händlerpreise -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="space-y-1">
              <div class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div class="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
          <div class="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <!-- Card 3: Meine Aktien -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-5 w-6 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div class="hidden sm:flex gap-6">
            <div v-for="i in 3" :key="i" class="space-y-1 text-right">
              <div class="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
              <div class="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 ml-auto" />
            </div>
          </div>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="i in 6" :key="i" class="px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div class="space-y-1.5">
                <div class="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div class="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div class="hidden sm:flex gap-6">
              <div v-for="j in 4" :key="j" class="space-y-1 text-right">
                <div class="h-3 w-12 rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
                <div class="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4 & 5 (Cash + Säule 3A) -->
      <div class="grid sm:grid-cols-2 gap-6">
        <div v-for="i in 2" :key="i" class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="p-6 space-y-3">
            <div v-for="j in 3" :key="j" class="flex justify-between">
              <div class="h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              <div class="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
