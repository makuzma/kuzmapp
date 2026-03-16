<template>
  <!-- Thumbnail -->
  <div class="inline-block">
    <div
      class="relative cursor-zoom-in rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-950 group"
      :style="{ maxWidth: (props.thumbWidth ?? 180) + 'px' }"
      @click="openLightbox"
    >
      <canvas ref="thumbCanvas" class="block w-full" draggable="false" />
      <div v-if="thumbLoading" class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900" style="min-height: 100px">
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin text-gray-400" />
      </div>
      <div v-if="!thumbLoading" class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <UIcon name="i-lucide-zoom-in" class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
      </div>
    </div>
    <div class="mt-1 flex items-center gap-1">
      <a :href="src" target="_blank" class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
        <UIcon name="i-lucide-external-link" class="w-3 h-3" />
        PDF öffnen
      </a>
      <span v-if="totalPages > 1" class="text-xs text-gray-400">· {{ totalPages }} Seiten</span>
    </div>
  </div>

  <!-- Lightbox Modal -->
  <UModal v-model:open="lightboxOpen" fullscreen>
    <template #content>
      <div class="flex flex-col h-full bg-black/90">
        <!-- Toolbar -->
        <div class="flex items-center justify-between px-4 py-3 text-white shrink-0">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium">PDF Vorschau</span>
            <div v-if="totalPages > 1" class="flex items-center gap-2">
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                icon="i-lucide-chevron-left"
                :disabled="lightboxPage <= 1"
                class="text-white hover:bg-white/20"
                @click="goPage(lightboxPage - 1)"
              />
              <span class="text-sm tabular-nums">{{ lightboxPage }} / {{ totalPages }}</span>
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                icon="i-lucide-chevron-right"
                :disabled="lightboxPage >= totalPages"
                class="text-white hover:bg-white/20"
                @click="goPage(lightboxPage + 1)"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a :href="src" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors">
              <UIcon name="i-lucide-download" class="w-4 h-4" />
              Herunterladen
            </a>
            <UButton variant="ghost" color="neutral" icon="i-lucide-x" class="text-white hover:bg-white/20" @click="lightboxOpen = false" />
          </div>
        </div>

        <!-- Canvas area -->
        <div class="flex-1 overflow-auto flex items-start justify-center p-4" @click.self="lightboxOpen = false">
          <div class="relative">
            <canvas ref="lightboxCanvas" class="rounded shadow-2xl block" />
            <div v-if="lightboxLoading" class="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded" style="min-width:200px; min-height:200px">
              <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-white" />
            </div>
          </div>
        </div>

        <!-- Keyboard hint -->
        <div v-if="totalPages > 1" class="text-center text-xs text-gray-500 pb-3 shrink-0">
          ← → zum Blättern · Esc zum Schließen
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ src: string; thumbWidth?: number }>()

const thumbCanvas = ref<HTMLCanvasElement | null>(null)
const lightboxCanvas = ref<HTMLCanvasElement | null>(null)
const thumbLoading = ref(true)
const lightboxLoading = ref(false)
const lightboxOpen = ref(false)
const lightboxPage = ref(1)
const totalPages = ref(0)

let pdfDoc: any = null

onMounted(async () => {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  try {
    pdfDoc = await pdfjsLib.getDocument(props.src).promise
    totalPages.value = pdfDoc.numPages
    await renderThumb()
  } catch {
    thumbLoading.value = false
  }
})

async function renderThumb() {
  if (!pdfDoc || !thumbCanvas.value) return
  const page = await pdfDoc.getPage(1)
  const nv = page.getViewport({ scale: 1 })
  const scale = (props.thumbWidth ?? 180) / nv.width
  const vp = page.getViewport({ scale })
  const ctx = thumbCanvas.value.getContext('2d')!
  thumbCanvas.value.width = vp.width
  thumbCanvas.value.height = vp.height
  await page.render({ canvasContext: ctx, viewport: vp }).promise
  thumbLoading.value = false
}

async function renderLightboxPage(num: number) {
  if (!pdfDoc || !lightboxCanvas.value) return
  lightboxLoading.value = true
  const page = await pdfDoc.getPage(num)
  const nv = page.getViewport({ scale: 1 })
  const maxW = Math.min(window.innerWidth - 64, 900)
  const scale = maxW / nv.width
  const vp = page.getViewport({ scale })
  const ctx = lightboxCanvas.value.getContext('2d')!
  lightboxCanvas.value.width = vp.width
  lightboxCanvas.value.height = vp.height
  await page.render({ canvasContext: ctx, viewport: vp }).promise
  lightboxLoading.value = false
}

async function openLightbox() {
  lightboxPage.value = 1
  lightboxOpen.value = true
  await nextTick()
  await renderLightboxPage(1)
}

async function goPage(num: number) {
  if (num < 1 || num > totalPages.value) return
  lightboxPage.value = num
  await renderLightboxPage(num)
}

function onKeyDown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'ArrowRight') goPage(lightboxPage.value + 1)
  else if (e.key === 'ArrowLeft') goPage(lightboxPage.value - 1)
  else if (e.key === 'Escape') lightboxOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>
