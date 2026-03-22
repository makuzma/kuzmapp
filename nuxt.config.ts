// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  routeRules: {
    '/dashboard': { ssr: false },
    '/account': { ssr: false },
    '/settings/**': { ssr: false },
    '/users': { ssr: false },
    '/vacations': { ssr: false },
    '/stocks': { ssr: false },
    '/stocks/**': { ssr: false },
  },
  nitro: {
    externals: {
      external: ['pdfkit'],
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0 0 * * *': ['finance:snapshot'],
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image'],
  ui: {
    colors: {
      primary: 'blue',
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? '',
    public: {
      superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? '',
    },
  },
})
