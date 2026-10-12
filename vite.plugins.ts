// Plugins propios de la compilación. Viven aparte de `vite.config.ts` para que
// la configuración quede corta y cada plugin se lea solo.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadEnv, type Plugin } from 'vite'

// El widget de accesibilidad arma contra cdn.jsdelivr.net las URL de su fuente
// para dislexia y de su idioma. Se reescriben a `/sienna/` y esos archivos se
// sirven desde el propio origen: sin tercero en tiempo de ejecución y sin
// abrir la CSP a un CDN. Solo se publica el español (el widget usa el inglés
// que trae dentro si un idioma falta).
const SIENNA_CDN = 'https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/'
const SIENNA_BASE = '/sienna/'
const SIENNA_FILES = ['fonts/OpenDyslexic3-Regular.woff', 'fonts/OpenDyslexic3-Regular.ttf', 'locales/es.json'] as const
export function handleSiennaSelfHosted(): Plugin {
  const dist = fileURLToPath(new URL('node_modules/sienna-accessibility/dist', import.meta.url))
  const read = (file: string) => readFileSync(join(dist, file)) // eslint-disable-line security/detect-non-literal-fs-filename -- lista fija de arriba
  return {
    name: 'resthub:sienna-autoalojado',
    transform(code, id) {
      return id.includes('sienna-accessibility') && code.includes(SIENNA_CDN) ? code.replaceAll(SIENNA_CDN, SIENNA_BASE) : null
    },
    configureServer(server) {
      server.middlewares.use(SIENNA_BASE, (request, response, next) => {
        const file = SIENNA_FILES.find((a) => `/${a}` === request.url)
        if (file === undefined) {
          next()
          return
        }
        response.end(read(file))
      })
    },
    generateBundle() {
      for (const file of SIENNA_FILES) {
        this.emitFile({ type: 'asset', fileName: `sienna/${file}`, source: read(file) })
      }
    },
  }
}

// `vercel.json` es estático y no conoce el dominio del API, que cambia por
// entorno (VITE_API_URL), así que su CSP deja `connect-src` en cualquier https.
// Al compilar con VITE_API_URL se suma una CSP en <meta> que lo acota al propio
// origen y al del API: el navegador aplica las dos y gana la más estricta, de
// modo que una inyección no puede sacar datos a un dominio ajeno.
export function boundConnections(): Plugin {
  // Solo corre al compilar (`apply: 'build'`), por eso el modo es producción.
  const api = loadEnv('production', process.cwd(), 'VITE_')['VITE_API_URL'] ?? ''
  return {
    name: 'resthub:acotar-conexiones',
    apply: 'build',
    transformIndexHtml() {
      if (api.trim() === '') {
        return []
      }
      const origin = new URL(api).origin
      return [{ tag: 'meta', injectTo: 'head-prepend', attrs: { 'http-equiv': 'Content-Security-Policy', content: `connect-src 'self' ${origin}` } }]
    },
  }
}

// La fuente de la interfaz la pide el CSS, así que el navegador la descubre
// recién al bajarlo (HTML → CSS → fuente) y el texto sale con la de respaldo
// hasta entonces. Precargarla la baja en paralelo con el CSS.
export function preloadSource(): Plugin {
  return {
    name: 'resthub:precargar-fuente',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const source = Object.keys(context.bundle ?? {}).find((file) => /geist-latin-wght-.*\.woff2$/u.test(file))
        if (source === undefined) {
          return []
        }
        return [{ tag: 'link', injectTo: 'head-prepend', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${source}` } }]
      },
    },
  }
}

// Lo que el service worker precachea al instalarse es lo primero que descarga
// una persona nueva, antes de abrir nada. Debe ser el armazón: el HTML, el
// archivo inicial con lo que importa de forma estática, la hoja de estilos y la
// fuente, es decir, lo que `index.html` enlaza. Las pantallas (cada una un
// archivo perezoso) se guardan cuando se abren (`runtimeCaching`) y las del
// mesero sin señal se adelantan al entrar (`useOfflineWarmup`).
const LINKED = /(?:src|href)="\/([^"]+)"/gu

/** La forma de `manifestTransforms` de Workbox: las entradas del precaché que quedan. */
type ShellFilter = <TEntry extends { readonly url: string }>(entries: TEntry[]) => { manifest: TEntry[]; warnings: string[] }

/** Las rutas de `assets/` que enlaza el HTML: scripts, `modulepreload`, estilos y fuentes. */
export function linkedAssets(html: string): Set<string> {
  return new Set([...html.matchAll(LINKED)].flatMap(([, url]) => (url?.startsWith('assets/') === true ? [url] : [])))
}

/**
 * El filtro del manifiesto de precaché: de `assets/` solo lo que enlaza
 * `index.html` (el armazón). Lo demás que Workbox encuentra en la carpeta (el
 * HTML, el registro del service worker) se queda.
 */
export function precacheShellOnly(): { plugin: Plugin; transform: ShellFilter } {
  const build = { directory: '' }
  const plugin: Plugin = {
    name: 'resthub:precache-armazon',
    apply: 'build',
    configResolved(config) {
      build.directory = join(config.root, config.build.outDir)
    },
  }
  const transform: ShellFilter = (entries) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- la carpeta de salida la fija la configuración de Vite
    const linked = linkedAssets(readFileSync(join(build.directory, 'index.html'), 'utf8'))
    const manifest = entries.filter(({ url }) => (url.startsWith('assets/') ? linked.has(url) : true))
    return { manifest, warnings: [] }
  }
  return { plugin, transform }
}
