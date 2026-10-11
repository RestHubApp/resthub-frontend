import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { responseHeaderBytes, transferSize, unique, type Resource } from './resources.ts'

const PRECACHE_URL = /\{url:"([^"]+)"/gu
const WORKBOX_FILE = /define\(\["\.\/(workbox-[\w-]+)"\]/u

/**
 * Lo que descarga el service worker al instalarse en la primera visita: su
 * propio archivo, el runtime de Workbox y cada archivo que precachea. Si una
 * pantalla de administración está en esa lista, la primera visita de `/acceso`
 * la paga aunque nadie la abra.
 */
export function serviceWorkerVisit(dist: string): Resource[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- la carpeta de la compilación la da quien corre el script
  const source = readFileSync(join(dist, 'sw.js'), 'utf8')
  const runtime = WORKBOX_FILE.exec(source)?.[1]
  const cached = [...source.matchAll(PRECACHE_URL)].flatMap(([, url]) => (url === undefined ? [] : [url]))
  const files = ['sw.js', ...(runtime === undefined ? [] : [`${runtime}.js`]), ...cached]
  return unique(files.map((file) => ({ url: file, bytes: transferSize(dist, file) + responseHeaderBytes(), origin: 'service-worker' as const })))
}
