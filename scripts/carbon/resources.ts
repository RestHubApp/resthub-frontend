import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

import { z } from 'zod'

/** Un archivo que la visita descarga y lo que pesa por la red. */
export interface Resource {
  /** Ruta dentro del sitio, sin barra inicial: `assets/index-abc.js`. */
  readonly url: string
  /** Bytes transferidos: comprimidos con brotli, como los sirve Vercel. */
  readonly bytes: number
  readonly origin: 'page' | 'service-worker'
}

// Calidad media de brotli: lo que un CDN suele aplicar sin precomprimir al máximo.
const BROTLI_QUALITY = 6

// Imágenes y fuentes ya vienen comprimidas: brotli no las achica.
const ALREADY_COMPRESSED = /\.(png|jpe?g|webp|woff2?|ico)$/u

/** Lo que pesa `file` (dentro de `dist`) al viajar por la red. */
export function transferSize(dist: string, file: string): number {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- el archivo sale del manifest de la propia compilación
  const content = readFileSync(join(dist, file))
  if (ALREADY_COMPRESSED.test(file)) {
    return content.length
  }
  return brotliCompressSync(content, { params: { [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } }).length
}

/** Los recursos sin repetir: cada archivo se descarga una sola vez por visita. */
export function unique(resources: readonly Resource[]): Resource[] {
  const seen = new Map<string, Resource>()
  for (const resource of resources) {
    seen.set(resource.url, seen.get(resource.url) ?? resource)
  }
  return [...seen.values()]
}

export function totalBytes(resources: readonly Resource[]): number {
  return resources.reduce((sum, resource) => sum + resource.bytes, 0)
}

// Estado, fecha, tipo, longitud, etag, caché y las cabeceras del CDN: lo que
// toda respuesta lleva además de las cabeceras de seguridad de vercel.json.
const BASE_HEADER_BYTES = 250

const vercelSchema = z.object({
  headers: z.array(z.object({ headers: z.array(z.object({ key: z.string(), value: z.string() })) })),
})

/**
 * Lo que pesan las cabeceras de una respuesta: la base más las de seguridad de
 * `vercel.json` (la CSP sola ronda los 400 bytes) en cada archivo.
 */
export function responseHeaderBytes(): number {
  const config = vercelSchema.parse(JSON.parse(readFileSync('vercel.json', 'utf8')))
  const security = config.headers.flatMap((rule) => rule.headers).reduce((sum, { key, value }) => sum + key.length + value.length + 4, 0)
  return BASE_HEADER_BYTES + security
}
