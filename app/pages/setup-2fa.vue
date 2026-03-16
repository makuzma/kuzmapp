<template>
  <div class="p-6">
    <div class="max-w-lg mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
        <h1 class="text-xl font-semibold">Zwei-Faktor-Authentifizierung</h1>
      </div>

      <!-- 2FA bereits aktiv -->
      <UCard v-if="session?.user?.twoFactorEnabled">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-shield-check" class="w-8 h-8 text-green-500" />
            <div>
              <p class="font-medium">2FA ist aktiv</p>
              <p class="text-sm text-gray-500">Dein Konto ist zusätzlich geschützt.</p>
            </div>
          </div>
          <USeparator />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Um 2FA zu deaktivieren, bestätige dein Passwort:
          </p>
          <form class="space-y-4" @submit.prevent="handleDisable">
            <UFormField label="Passwort">
              <UInput v-model="password" type="password" required placeholder="••••••••" class="w-full" />
            </UFormField>
            <UAlert v-if="error" color="error" variant="subtle" :description="error" />
            <UButton type="submit" color="error" variant="outline" :loading="loading" block>
              2FA deaktivieren
            </UButton>
          </form>
        </div>
      </UCard>

      <!-- Schritt 1: Passwort eingeben -->
      <UCard v-else-if="!qrUri">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-shield" class="w-8 h-8 text-gray-400" />
            <div>
              <p class="font-medium">2FA einrichten</p>
              <p class="text-sm text-gray-500">Schütze dein Konto mit einer Authenticator-App.</p>
            </div>
          </div>
          <USeparator />
          <form class="space-y-4" @submit.prevent="handleEnable">
            <UFormField label="Passwort bestätigen">
              <UInput v-model="password" type="password" required placeholder="••••••••" class="w-full" />
            </UFormField>
            <UAlert v-if="error" color="error" variant="subtle" :description="error" />
            <UButton type="submit" :loading="loading" block>Weiter</UButton>
          </form>
        </div>
      </UCard>

      <!-- Schritt 2: QR-Code scannen + bestätigen -->
      <UCard v-else>
        <div class="space-y-5">
          <div>
            <p class="font-medium">QR-Code scannen</p>
            <p class="text-sm text-gray-500 mt-1">
              Öffne Google Authenticator oder eine andere App und scanne diesen Code:
            </p>
          </div>

          <div class="flex justify-center">
            <img :src="qrUri" alt="QR Code" class="w-48 h-48 rounded-lg border border-gray-200 dark:border-gray-700" />
          </div>

          <UAlert color="neutral" variant="subtle" title="Manueller Code">
            <template #description>
              <code class="text-xs break-all">{{ totpSecret }}</code>
            </template>
          </UAlert>

          <USeparator />

          <form class="space-y-4" @submit.prevent="handleVerify">
            <UFormField label="Code aus der App eingeben">
              <UInput
                v-model="totpCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                required
                placeholder="000000"
                class="w-full text-center tracking-widest text-lg"
              />
            </UFormField>
            <UAlert v-if="error" color="error" variant="subtle" :description="error" />
            <UButton type="submit" :loading="loading" block>2FA aktivieren</UButton>
          </form>
        </div>
      </UCard>

      <!-- Backup-Codes -->
      <UCard v-if="backupCodes.length">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-key" class="w-5 h-5 text-yellow-500" />
            <p class="font-medium">Backup-Codes</p>
          </div>
          <UAlert
            color="warning"
            variant="subtle"
            description="Speichere diese Codes sicher! Jeder Code kann nur einmal verwendet werden."
          />
          <div class="grid grid-cols-2 gap-2">
            <code
              v-for="code in backupCodes"
              :key="code"
              class="bg-gray-100 dark:bg-gray-800 text-sm px-3 py-2 rounded text-center font-mono"
            >
              {{ code }}
            </code>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ middleware: 'auth' })

const headers = useRequestHeaders(['cookie'])
const { data: session } = await authClient.useSession(
  (url, options) => useFetch(url, {
    ...options,
    headers: { ...(options?.headers as Record<string, string> || {}), ...headers },
  })
)

const password = ref('')
const totpCode = ref('')
const qrUri = ref('')
const totpSecret = ref('')
const backupCodes = ref<string[]>([])
const error = ref('')
const loading = ref(false)

async function handleEnable() {
  error.value = ''
  loading.value = true
  const { data, error: err } = await twoFactor.enable({ password: password.value })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Fehler beim Aktivieren'
  } else if (data) {
    qrUri.value = await QRCode.toDataURL(data.totpURI)
    totpSecret.value = new URL(data.totpURI).searchParams.get('secret') ?? ''
  }
}

async function handleVerify() {
  error.value = ''
  loading.value = true
  const { data, error: err } = await twoFactor.verifyTotp({ code: totpCode.value })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Ungültiger Code'
  } else {
    backupCodes.value = (data as any)?.backupCodes ?? []
    if (!backupCodes.value.length) {
      await navigateTo('/dashboard')
    }
  }
}

async function handleDisable() {
  error.value = ''
  loading.value = true
  const { error: err } = await twoFactor.disable({ password: password.value })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Fehler beim Deaktivieren'
  } else {
    await navigateTo('/dashboard')
  }
}
</script>
