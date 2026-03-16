// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    externals: {
      external: ['pdfkit'],
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
