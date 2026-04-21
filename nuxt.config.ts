// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    devServer: { host: '0.0.0.0' },
    modules: ['@nuxt/ui', '@nuxt/eslint', '@pinia/nuxt'],
    css: ['~/assets/css/main.css'],
    nitro: {
        experimental: {
            websocket: true,
        },
    },
});
