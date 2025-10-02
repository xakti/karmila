import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import {PrimeVueResolver} from '@primevue/auto-import-resolver'
import {VitePWA} from 'vite-plugin-pwa'


// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(), vueDevTools(), tailwindcss(),
        Components({resolvers: [PrimeVueResolver()]}),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Karmila - Vexanium Explorer',
                short_name: 'Karmila',
                start_url: '/',
                display: 'standalone',
                background_color: '#e0f7fa',
                theme_color: '#e0f7fa',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'maskable-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any',
                    },
                ],
            }
        })
    ],
    build: {
        emptyOutDir: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'wharfkit': ['@wharfkit/antelope', '@wharfkit/signing-request', '@wharfkit/abicache', 'pako'],
                    'vue': ['vue', 'vue-router'],
                    'gui': ['primevue', 'tailwindcss-primeui', 'tailwindcss', '@primeuix/themes'],
                }
            }
        },
    },
    resolve: {
        alias: [
            { find: "@", replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            { find: "buffer", replacement: 'rollup-plugin-node-polyfills/polyfills/buffer-es6' },
            // '@': fileURLToPath(new URL('./src', import.meta.url)),
            // buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6'
        ],
    },
    define: {
        global: 'globalThis'
    },
    server: {
        host: true
    }
})
