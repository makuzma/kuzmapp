<template>
  <div class="relative group block w-full">
    <slot :open-add-form="openModal" :comments-count="comments.length" />

    <!-- Badge -->
    <div
      v-if="comments.length > 0 && !hideBadge"
      class="absolute -top-2 -right-2 z-[50]"
    >
      <button
        class="w-5 h-5 bg-amber-400 hover:bg-amber-500 rounded-full shadow flex items-center justify-center transition-transform hover:scale-110"
        @click.stop="openModal"
      >
        <UIcon name="i-lucide-message-circle" class="w-3 h-3 text-amber-900" />
      </button>
    </div>

    <!-- Comments Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9990]"
        @mousedown.self="showModal = false"
      >
        <div
          class="absolute bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 max-h-[75vh] flex flex-col"
          :style="{ left: modalX + 'px', top: modalY + 'px' }"
          @click.stop
          @contextmenu.prevent
        >
          <!-- Header (drag handle) -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
            @mousedown="startDrag"
          >
            <span class="text-sm font-semibold">Kommentare</span>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer" @mousedown.stop @click="showModal = false">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Comments List -->
          <div class="overflow-y-auto flex-1 px-3 py-2 space-y-3">
            <div v-if="comments.length === 0" class="text-xs text-gray-400 text-center py-4">
              Noch keine Kommentare.
            </div>

            <div
              v-for="c in comments"
              :key="c.id"
              class="flex gap-2.5 group/comment rounded-lg px-2 py-1 -mx-2 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
              :class="[c.userId !== currentUserId ? 'cursor-pointer' : '', c.replyToId ? 'ml-5 border-l-2 border-primary-200 dark:border-primary-800 pl-2' : '']"
              @click="c.userId !== currentUserId ? startReply(c) : null"
            >
              <!-- Avatar -->
              <div class="relative w-7 h-7 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0 mt-0.5">
                <span class="text-[10px] font-semibold text-primary-600 dark:text-primary-300">
                  {{ (c.authorName?.[0] ?? '?').toUpperCase() }}
                </span>
                <img
                  :src="`/api/avatar/${c.userId}`"
                  class="absolute inset-0 w-full h-full object-cover"
                  :alt="c.authorName"
                  @error="(e) => (e.target as HTMLImageElement).remove()"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <UIcon v-if="c.replyToId" name="i-lucide-corner-down-right" class="w-3 h-3 text-primary-400 shrink-0" />
                  <span class="text-xs font-semibold">{{ c.authorName }}</span>
                  <span class="text-[10px] text-gray-400">{{ formatDate(c.createdAt) }}</span>
                </div>
                <div v-if="c.subject" class="text-[10px] font-medium text-primary-600 dark:text-primary-400 mb-0.5">{{ c.subject }}</div>
                <p class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">{{ c.text }}</p>
              </div>

              <!-- Delete -->
              <button
                v-if="currentUserId && c.userId === currentUserId"
                class="shrink-0 mt-0.5 text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                title="Löschen"
                @click.stop="deleteComment(c.id)"
              >
                <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Add Comment -->
          <div class="px-3 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <!-- Reply indicator -->
            <div v-if="replyToName" class="flex items-center justify-between mb-1.5 px-1">
              <span class="text-[10px] text-primary-500 dark:text-primary-400">
                <UIcon name="i-lucide-corner-down-right" class="w-3 h-3 inline -mt-0.5 mr-0.5" />
                Antwort an <span class="font-semibold">@{{ replyToName }}</span>
              </span>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="cancelReply">
                <UIcon name="i-lucide-x" class="w-3 h-3" />
              </button>
            </div>
            <div class="relative">
              <textarea
                ref="addTextareaRef"
                v-model="addForm.text"
                class="w-full text-xs resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 focus:outline-none focus:border-primary-400 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                rows="2"
                placeholder="Kommentar hinzufügen… @ zum Erwähnen"
                @input="onAddInput"
                @keydown="onMentionKeydown"
              />
              <!-- Mention dropdown -->
              <div
                v-if="mentionUsers.length > 0"
                class="absolute left-0 bottom-full mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-36 max-h-40 overflow-y-auto"
              >
                <button
                  v-for="(u, i) in mentionUsers"
                  :key="u.id"
                  class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  :class="{ 'bg-primary-50 dark:bg-primary-950': mentionIndex === i }"
                  @mousedown.prevent="insertMention(u)"
                >
                  <div class="relative w-5 h-5 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                    <span class="text-[9px] font-semibold text-primary-600 dark:text-primary-300">{{ (u.name?.[0] ?? '?').toUpperCase() }}</span>
                    <img :src="`/api/avatar/${u.id}`" class="absolute inset-0 w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).remove()" />
                  </div>
                  {{ u.name }}
                </button>
              </div>
            </div>
            <div class="flex justify-end mt-1.5">
              <UButton size="xs" :disabled="!addForm.text.trim()" :loading="saving" @click="submitAdd">Speichern</UButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'

const props = defineProps<{
  targetType: string
  targetId: string
  hideBadge?: boolean
}>()

const currentUserId = ref<string | null>(null)

const emit = defineEmits(['update:commentsCount'])

const comments = ref<any[]>([])

async function fetchComments() {
  if (!props.targetId) return
  try {
    comments.value = await $fetch(`/api/comments`, {
      query: { targetType: props.targetType, targetId: props.targetId }
    })
    emit('update:commentsCount', comments.value.length)
  } catch (e) {
    console.error('Failed to fetch comments', e)
  }
}

onMounted(async () => {
  if (props.targetId) fetchComments()
  try {
    const me = await $fetch<{ id: string }>('/api/account')
    currentUserId.value = me.id
  } catch {}
})

// Modal + drag
const showModal = ref(false)
const modalX = ref(0)
const modalY = ref(0)

function openModal() {
  addForm.text = ''
  addForm.subject = ''
  mentionQuery.value = ''
  modalX.value = window.innerWidth / 2 - 160
  modalY.value = window.innerHeight / 2 - 200
  showModal.value = true
}

let dragOffsetX = 0
let dragOffsetY = 0

function startDrag(e: MouseEvent) {
  dragOffsetX = e.clientX - modalX.value
  dragOffsetY = e.clientY - modalY.value
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  modalX.value = e.clientX - dragOffsetX
  modalY.value = e.clientY - dragOffsetY
}

function stopDrag() {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

// Reply
const replyToId = ref<string | null>(null)
const replyToName = ref<string>('')

function startReply(comment: any) {
  replyToId.value = comment.id
  replyToName.value = comment.authorName
  addForm.text = `@${comment.authorName} `
  nextTick(() => {
    if (addTextareaRef.value) {
      addTextareaRef.value.focus()
      const len = addForm.text.length
      addTextareaRef.value.setSelectionRange(len, len)
    }
  })
}

function cancelReply() {
  replyToId.value = null
  replyToName.value = ''
  addForm.text = ''
}

// Add
const saving = ref(false)
const addForm = reactive({ subject: '', text: '' })
const addTextareaRef = ref<HTMLTextAreaElement | null>(null)

async function submitAdd() {
  if (!addForm.text.trim()) return
  saving.value = true

  let extractedSubject = ''
  const dsMatch = addForm.text.match(/Dataset=[^\s]+/i)
  if (dsMatch) extractedSubject = dsMatch[0]

  try {
    const newComment = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        targetType: props.targetType,
        targetId: props.targetId,
        subject: extractedSubject,
        text: addForm.text,
        replyToId: replyToId.value ?? undefined,
      }
    })
    if (replyToId.value) {
      const idx = comments.value.findIndex(c => c.id === replyToId.value)
      if (idx !== -1) {
        comments.value.splice(idx + 1, 0, newComment)
      } else {
        comments.value.push(newComment)
      }
      replyToId.value = null
      replyToName.value = ''
    } else {
      comments.value.push(newComment)
    }
    emit('update:commentsCount', comments.value.length)
    addForm.text = ''
    addForm.subject = ''
  } catch (e) {
    console.error(e)
    useToast().add({ title: 'Fehler beim Speichern', color: 'error' })
  } finally {
    saving.value = false
  }
}

// Delete
async function deleteComment(id: string) {
  try {
    await $fetch(`/api/comments/${id}`, { method: 'DELETE' })
    comments.value = comments.value.filter(x => x.id !== id)
    emit('update:commentsCount', comments.value.length)
  } catch (e) {
    console.error(e)
    useToast().add({ title: 'Fehler beim Löschen', color: 'error' })
  }
}

// @mention
type UserOption = { id: string; name: string }
const allUsers = ref<UserOption[]>([])
const mentionQuery = ref('')
const mentionIndex = ref(0)
const mentionCursorPos = ref(0)
const mentionActive = ref(false)

const mentionUsers = computed(() => {
  if (!mentionActive.value) return []
  if (!mentionQuery.value) return allUsers.value
  const q = mentionQuery.value.toLowerCase()
  return allUsers.value.filter(u => u.name.toLowerCase().includes(q))
})

async function ensureUsers() {
  if (allUsers.value.length === 0) {
    try {
      allUsers.value = await $fetch('/api/users')
    } catch (e) {
      console.error(e)
    }
  }
}

async function onAddInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  const pos = el.selectionStart ?? 0
  const before = addForm.text.slice(0, pos)
  const match = before.match(/@(\w*)$/)
  if (match) {
    await ensureUsers()
    mentionQuery.value = match[1] ?? ''
    mentionCursorPos.value = before.lastIndexOf('@')
    mentionActive.value = true
    mentionIndex.value = 0
  } else {
    mentionActive.value = false
  }
}

function insertMention(user: UserOption) {
  const before = addForm.text.slice(0, mentionCursorPos.value)
  const afterAt = addForm.text.slice(mentionCursorPos.value + 1 + mentionQuery.value.length)
  addForm.text = before + `@${user.name} ` + afterAt
  mentionActive.value = false
  nextTick(() => {
    if (addTextareaRef.value) {
      const pos = (before + `@${user.name} `).length
      addTextareaRef.value.focus()
      addTextareaRef.value.setSelectionRange(pos, pos)
    }
  })
}

function onMentionKeydown(e: KeyboardEvent) {
  if (mentionActive.value && mentionUsers.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mentionIndex.value = (mentionIndex.value + 1) % mentionUsers.value.length
      return
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      mentionIndex.value = (mentionIndex.value - 1 + mentionUsers.value.length) % mentionUsers.value.length
      return
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const u = mentionUsers.value[mentionIndex.value]
      if (u) insertMention(u)
      return
    } else if (e.key === 'Escape') {
      mentionActive.value = false
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitAdd()
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr))
}
</script>
