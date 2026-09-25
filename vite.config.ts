import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// El color de la marca. Tiene que coincidir con el `theme-color` de index.html
// y con `--primary` de index.css, o la barra del sistema cambia de tono al
// abrir la aplicacion instalada.
const THEME_COLOR = '#9a3412'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Instalable, sin modo sin conexion: el service worker solo guarda el
    // armazon de la aplicacion (HTML, JS, CSS e iconos). Ninguna respuesta del
    // API se guarda en cache; un pedido tiene que viajar al servidor o fallar a
    // la vista, nunca quedar en una cola que el mesero no ve.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
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
          groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/u, priority: 10 }],
        },
      },
    },
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
