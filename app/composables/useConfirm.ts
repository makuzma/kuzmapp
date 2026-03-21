const confirmOpen = ref(false)
const confirmMessage = ref('')
const confirmTitle = ref('')
let resolveFn: ((v: boolean) => void) | null = null

export function useConfirm() {
  function confirm(message: string, title = 'Bestätigen') {
    confirmTitle.value = title
    confirmMessage.value = message
    confirmOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolveFn = resolve
    })
  }

  function onConfirm() {
    confirmOpen.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  function onCancel() {
    confirmOpen.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return { confirm, confirmOpen, confirmMessage, confirmTitle, onConfirm, onCancel }
}
