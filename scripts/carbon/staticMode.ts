import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { chunkOf, filesOf, readManifest, type Manifest } from './manifest.ts'
import { responseHeaderBytes, transferSize, unique, type Resource } from './resources.ts'
import type { Route } from './routes.ts'

// Las etiquetas de index.html que el navegador sigue al cargar la página.
const TAG = /<(script|link)\b([^>]*)>/gu
// Lo que un `<link>` hace descargar: el resto (`apple-touch-icon`, `icon` en .ico) no se pide en una visita normal.
const FOLLOWED_LINKS = new Set(['modulepreload', 'stylesheet', 'preload', 'manifest'])

// Los atributos de una etiqueta (`rel="preload" as="font" crossorigin href="…"`): el texto, partido por
// las comillas, alterna «nombre=» y valor. Los valores de esta compilación no llevan comillas dentro.
function attributesOf(source: string): Map<string, string> {
  const parts = source.split('"')
  const attributes = new Map<string, string>()
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const name = parts[index]?.trim().split(/\s+/u).at(-1)?.replace(/=$/u, '')
    const value = parts[index + 1]
    if (name !== undefined && value !== undefined) {
      attributes.set(name, value)
    }
  }
  return attributes
}

function isFollowed(tag: string, attributes: Map<string, string>): boolean {
  if (tag === 'script') {
    return attributes.has('src')
  }
  const rel = attributes.get('rel') ?? ''
  return FOLLOWED_LINKS.has(rel) || (rel === 'icon' && attributes.get('type') === 'image/svg+xml')
}

/** Lo que descarga index.html: él mismo, sus scripts, hojas de estilo, fuentes precargadas, manifiesto e icono. */
function documentFiles(dist: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- la carpeta de la compilación la da quien corre el script
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const files = [...html.matchAll(TAG)].flatMap(([, tag, source]) => {
    const attributes = attributesOf(source ?? '')
    const target = attributes.get('src') ?? attributes.get('href')
    return tag !== undefined && target !== undefined && isFollowed(tag, attributes) ? [target.replace(/^\//u, '')] : []
  })
  return ['index.html', ...files]
}

function pageResource(dist: string, file: string): Resource {
  return { url: file, bytes: transferSize(dist, file) + responseHeaderBytes(), origin: 'page' }
}

function lazyFiles(manifest: Manifest, route: Route): string[] {
  return route.lazy.flatMap((src) => filesOf(manifest, chunkOf(manifest, src)))
}

/**
 * Lo que se baja una vez, ya con sesión, para que el mesero siga tomando
 * pedidos sin señal: las pantallas sin señal con sus dependencias, sin lo que
 * el armazón ya trae. No cuenta en la nota de la primera visita: el modo
 * navegador bloquea el service worker, que es quien dispara esa descarga.
 */
export function offlinePack(dist: string, screens: readonly string[]): Resource[] {
  const manifest = readManifest(dist)
  const shell = new Set(documentFiles(dist))
  const files = screens.flatMap((src) => filesOf(manifest, chunkOf(manifest, src)))
  return unique(files.filter((file) => !shell.has(file)).map((file) => pageResource(dist, file)))
}

/**
 * Lo que carga la primera visita de una ruta, deducido del build: el HTML y lo
 * que enlaza, más los módulos perezosos de la ruta con sus dependencias.
 *
 * Es una cota inferior: lo que el código pide después de montarse (datos del
 * API, módulos que importa al interactuar) solo lo ve el modo navegador. Las
 * fuentes son las que index.html precarga (el subconjunto latino); el resto de
 * subconjuntos de la fuente no se descarga si la página no usa esos caracteres.
 */
export function staticVisit(dist: string, route: Route): Resource[] {
  const manifest = readManifest(dist)
  const files = [...documentFiles(dist), ...lazyFiles(manifest, route)]
  return unique(files.map((file) => pageResource(dist, file)))
}
