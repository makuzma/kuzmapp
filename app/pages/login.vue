<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900" @mousemove="onMouse">
    <!-- Dim base layer (always visible, subtle) -->
    <img src="/bg/hero.svg" class="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20" aria-hidden="true" />
    <!-- Spotlight layer (only visible near cursor) -->
    <img src="/bg/hero.svg" class="absolute inset-0 w-full h-full object-cover pointer-events-none" :style="spotlightStyle" aria-hidden="true" />

    <div class="w-full max-w-sm relative z-10">
      <!-- Card -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <!-- Logo / App name inside card -->
        <div class="text-center mb-6">
          <img src="/bg/hk-logo-red.svg" alt="HKJobs Logo" class="w-16 h-16 mx-auto mb-3 drop-shadow-xl" />
          <h1 class="text-xl font-bold text-white tracking-tight">HKJ</h1>
          <span class="inline-block mt-1 text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2.5 py-0.5">1.0 Beta</span>
        </div>

        <!-- Divider -->
        <div class="border-t border-white/10 mb-6" />

        <!-- Step title -->
        <div class="mb-5 text-center">
          <h2 class="text-base font-semibold text-white">
            {{ step === 'totp' ? 'Zwei-Faktor-Authentifizierung' : 'Willkommen zurück' }}
          </h2>
          <p class="text-sm text-slate-400 mt-1">
            {{ step === 'totp' ? 'Gib den Code aus deiner Authenticator-App ein' : 'Melde dich mit deinem Konto an' }}
          </p>
        </div>

        <!-- Step 1: Credentials -->
        <form v-if="step === 'credentials'" class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-300">E-Mail</label>
            <UInput
              v-model="email"
              type="email"
              required
              placeholder="deine@email.de"
              class="w-full"
              :ui="inputUi"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-300">Passwort</label>
            <UInput
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full"
              :ui="inputUi"
            />
          </div>
          <UAlert v-if="error" color="error" variant="subtle" :description="error" class="mt-2" />
          <div class="space-y-2 pt-2">
            <UButton
              type="submit"
              :loading="loading"
              block
              class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/25 font-semibold"
            >
              Einloggen
            </UButton>
            <UButton
              variant="ghost"
              block
              :disabled="loading"
              class="text-slate-400 hover:text-white hover:bg-white/10"
              @click="handleRegister"
            >
              Konto erstellen
            </UButton>
          </div>
        </form>

        <!-- Step 2: TOTP -->
        <form v-if="step === 'totp'" class="space-y-4" @submit.prevent="handleTotp">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-300">6-stelliger Code</label>
            <UInput
              v-model="totpCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              required
              placeholder="000000"
              class="w-full text-center tracking-widest text-lg"
              :ui="inputUi"
            />
          </div>
          <UAlert v-if="error" color="error" variant="subtle" :description="error" />
          <div class="space-y-2 pt-2">
            <UButton
              type="submit"
              :loading="loading"
              block
              class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/25 font-semibold"
            >
              Bestätigen
            </UButton>
            <UButton
              variant="ghost"
              block
              class="text-slate-400 hover:text-white hover:bg-white/10"
              @click="step = 'credentials'"
            >
              Zurück
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', middleware: 'guest' })

// Actual mouse position
const targetX = ref(-9999)
const targetY = ref(-9999)
// Smoothed spotlight position (lerped)
const mx = ref(-9999)
const my = ref(-9999)

function onMouse(e: MouseEvent) {
  targetX.value = e.clientX
  targetY.value = e.clientY
}

// Smooth follow via rAF lerp (speed 0.06 = slow/smooth)
onMounted(() => {
  mx.value = window.innerWidth / 2
  my.value = window.innerHeight / 2
  targetX.value = mx.value
  targetY.value = my.value

  let raf: number
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const tick = () => {
    mx.value = lerp(mx.value, targetX.value, 0.06)
    my.value = lerp(my.value, targetY.value, 0.06)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(raf))
})

const spotlightStyle = computed(() => ({
  WebkitMaskImage: `radial-gradient(circle 350px at ${mx.value}px ${my.value}px, black 0%, transparent 100%)`,
  maskImage: `radial-gradient(circle 350px at ${mx.value}px ${my.value}px, black 0%, transparent 100%)`,
}))

const step = ref<'credentials' | 'totp'>('credentials')
const email = ref('')
const password = ref('')
const totpCode = ref('')
const error = ref('')
const loading = ref(false)

const inputUi = {
  base: 'bg-white/10 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20',
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  const { error: err, data } = await signIn.email({
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (err?.status === 403 || (data as any)?.twoFactorRedirect) {
    step.value = 'totp'
  } else if (err) {
    error.value = err.message ?? 'Login fehlgeschlagen'
  } else {
    window.location.href = '/dashboard'
  }
}

async function handleTotp() {
  error.value = ''
  loading.value = true
  const { error: err } = await twoFactor.verifyTotp({ code: totpCode.value })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Ungültiger Code'
  } else {
    window.location.href = '/dashboard'
  }
}

async function handleRegister() {
  error.value = ''
  loading.value = true
  const { error: err } = await signUp.email({
    email: email.value,
    password: password.value,
    name: email.value,
  })
  loading.value = false
  if (err) {
    error.value = err.message ?? 'Registrierung fehlgeschlagen'
  } else {
    window.location.href = '/dashboard'
  }
}
</script>
