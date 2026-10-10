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
const SIENNA_ARCHIVOS = ['fonts/OpenDyslexic3-Regular.woff', 'fonts/OpenDyslexic3-Regular.ttf', 'locales/es.json'] as const
export function siennaAutoalojado(): Plugin {
  const dist = fileURLToPath(new URL('node_modules/sienna-accessibility/dist', import.meta.url))
  const leer = (archivo: string) => readFileSync(join(dist, archivo)) // eslint-disable-line security/detect-non-literal-fs-filename -- lista fija de arriba
  return {
    name: 'resthub:sienna-autoalojado',
    transform(codigo, id) {
      return id.includes('sienna-accessibility') && codigo.includes(SIENNA_CDN) ? codigo.replaceAll(SIENNA_CDN, SIENNA_BASE) : null
    },
    configureServer(servidor) {
      servidor.middlewares.use(SIENNA_BASE, (peticion, respuesta, siguiente) => {
        const archivo = SIENNA_ARCHIVOS.find((a) => `/${a}` === peticion.url)
        if (archivo === undefined) {
          siguiente()
          return
        }
        respuesta.end(leer(archivo))
      })
    },
    generateBundle() {
      for (const archivo of SIENNA_ARCHIVOS) {
        this.emitFile({ type: 'asset', fileName: `sienna/${archivo}`, source: leer(archivo) })
      }
    },
  }
}

// `vercel.json` es estático y no conoce el dominio del API, que cambia por
// entorno (VITE_API_URL), así que su CSP deja `connect-src` en cualquier https.
// Al compilar con VITE_API_URL se suma una CSP en <meta> que lo acota al propio
// origen y al del API: el navegador aplica las dos y gana la más estricta, de
// modo que una inyección no puede sacar datos a un dominio ajeno.
export function acotarConexiones(): Plugin {
  // Solo corre al compilar (`apply: 'build'`), por eso el modo es producción.
  const api = (loadEnv('production', process.cwd(), 'VITE_').VITE_API_URL as string | undefined) ?? ''
  return {
    name: 'resthub:acotar-conexiones',
    apply: 'build',
    transformIndexHtml() {
      if (api.trim() === '') {
        return []
      }
      const origen = new URL(api).origin
      return [{ tag: 'meta', injectTo: 'head-prepend', attrs: { 'http-equiv': 'Content-Security-Policy', content: `connect-src 'self' ${origen}` } }]
    },
  }
}

// La fuente de la interfaz la pide el CSS, así que el navegador la descubre
// recién al bajarlo (HTML → CSS → fuente) y el texto sale con la de respaldo
// hasta entonces. Precargarla la baja en paralelo con el CSS.
export function precargarFuente(): Plugin {
  return {
    name: 'resthub:precargar-fuente',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, contexto) {
        const fuente = Object.keys(contexto.bundle ?? {}).find((archivo) => /geist-latin-wght-normal-.*\.woff2$/u.test(archivo))
        if (fuente === undefined) {
          return []
        }
        return [{ tag: 'link', injectTo: 'head-prepend', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${fuente}` } }]
      },
    },
  }
}
