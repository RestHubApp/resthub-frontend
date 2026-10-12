import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { boundConnections, preloadSource, handleSiennaSelfHosted, precacheShellOnly } from './vite.plugins'

// El color de la marca. Tiene que coincidir con el `theme-color` de index.html
// y con `--primary` de index.css, o la barra del sistema cambia de tono al
// abrir la aplicacion instalada.
const THEME_COLOR = '#9a3412'

// Las cabeceras de seguridad que pone Vercel (CSP incluida), también en
// `vite preview`: así una CSP que rompe algo se ve en local y no en producción.
// connect-src admite cualquier origen https porque el API cambia por entorno
// (VITE_API_URL); `acotarConexiones` lo cierra al compilar con esa variable.
// `script-src 'self'` es lo que frena una inyección. El widget de accesibilidad
// pide 'unsafe-inline' en estilos.
interface VercelConfig {
  readonly headers: readonly { readonly headers: readonly { readonly key: string; readonly value: string }[] }[]
}
// eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta fija del repositorio, armada con import.meta.url
const vercel = JSON.parse(readFileSync(new URL('vercel.json', import.meta.url), 'utf8')) as VercelConfig
// En local el API va por http (localhost:8000, o 8201 en las E2E), que la CSP
// de producción no deja conectar: solo aquí se le suma.
const SECURITY_HEADERS = Object.fromEntries(
  vercel.headers.flatMap((rule) => rule.headers.map(({ key, value }) => [
    key,
    key === 'Content-Security-Policy' ? value.replace("connect-src 'self' https:", "connect-src 'self' https: http://localhost:* http://127.0.0.1:*") : value,
  ])),
)

const shell = precacheShellOnly()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadSource(),
    handleSiennaSelfHosted(),
    boundConnections(),
    shell.plugin,
    // Instalable: el service worker solo guarda el armazon de la aplicacion
    // (HTML, JS, CSS e iconos). Ninguna respuesta del API se guarda en cache.
    // Sin senal, lo unico que espera es un pedido nuevo del mesero, en una cola
    // a la vista (`features/orders/offline`) que se envia sola al volver.
    VitePWA({
      registerType: 'autoUpdate',
      // El registro del service worker no tiene que frenar el primer render:
      // con `script` iba como <script> síncrono en el <head> (Lighthouse lo
      // marcaba como recurso que bloquea el renderizado).
      injectRegister: 'script-defer',
      // Ni los iconos de la aplicacion instalada ni los de la pestana van al
      // precache: el sistema guarda los primeros al instalar y el navegador pide
      // los segundos una vez. Sin senal no hacen falta.
      includeAssets: [],
      includeManifestIcons: false,
      manifest: {
        name: 'RestHub',
        short_name: 'RestHub',
        description: 'Pedidos, cocina, caja e inventario para restaurantes pequeños.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#faf7f2',
        theme_color: THEME_COLOR,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Una navegacion a /api no es una pantalla: que llegue al servidor.
        navigateFallbackDenylist: [/^\/api\//],
        // Al instalarse solo se guarda el armazon (lo que enlaza index.html): una
        // persona nueva no paga las pantallas que quiza nunca abra. Cada pantalla
        // se guarda al abrirla (`runtimeCaching`) y las que el mesero necesita
        // sin senal se adelantan al entrar (`useOfflineWarmup`).
        // El service worker toma el control de la pestana que lo instalo: sin esto, el
        // armazon de la primera visita no pasa por el y las pantallas que se bajan
        // despues (`useOfflineWarmup`) no se guardarian hasta la siguiente carga.
        clientsClaim: true,
        // El runtime de Workbox dentro de sw.js: un archivo menos que bajar al instalarse.
        inlineWorkboxRuntime: true,
        globPatterns: ['**/*.{js,css,html,woff2}'],
        manifestTransforms: [shell.transform],
        runtimeCaching: [{
          urlPattern: /^https?:\/\/[^/]+\/assets\/[^/]+\.js$/u,
          handler: 'CacheFirst',
          options: {
            // El mismo nombre que `services/screenCache.ts`.
            cacheName: 'resthub-pantallas-visitadas',
            expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        }],
      },
    }),
  ],
  resolve: {
    alias: {
      // shadcn/ui genera sus importaciones con este alias y lo exige para
      // funcionar. Se resuelve desde la URL del modulo y no con __dirname,
      // que no existe en un modulo ES.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // React cambia menos que la aplicacion: en su propio archivo queda
          // en la cache del celular entre una version y la siguiente.
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/u, priority: 10 },
            // Lo que el archivo inicial importa de forma estatica (el router, las consultas,
            // el armazon, los componentes de Radix) va en un solo archivo: cada archivo mas es
            // una peticion con sus cabeceras (1 kB de CSP y seguridad) y brotli comprime mejor
            // uno grande que veinte chicos. Las pantallas siguen siendo perezosas.
            { name: 'shell', tags: ['$initial'], priority: 5 },
          ],
        },
      },
    },
  },
  preview: {
    headers: SECURITY_HEADERS,
  },
  server: {
    port: 5173,
    proxy: {
      // En desarrollo el API responde en el mismo origen que la interfaz, asi
      // que no hace falta CORS ni VITE_API_URL.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
