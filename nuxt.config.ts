// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    devServer: { 
        host: '0.0.0.0',
        port: 3000
    },
    modules: ['@nuxt/ui', '@nuxt/eslint', '@pinia/nuxt'],
    css: ['~/assets/css/main.css'],
    runtimeConfig: {
        public: {
            supabaseUrl: process.env.SUPABASE_URL ?? '',
            supabaseKey: process.env.SUPABASE_KEY ?? '',
        },
    },
    routeRules: {
        '/**': {
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
            },
        },
    },
    vite: {
        server: {
            hmr: {
                protocol: 'ws',
                host: '0.0.0.0',
                port: 24678,
            },
        },
    },
});
