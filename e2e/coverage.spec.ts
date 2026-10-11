// Falla si el inventario de la interfaz quedó viejo o si algún elemento no
// tiene una prueba que lo recorra. No abre el navegador: lee el código.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { expect, test } from '@playwright/test'

import { FILE_INVENTORY, type Element, inventory } from './inventory/inventory'

const E2E = import.meta.dirname

function specs(folder: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
  return readdirSync(folder).flatMap((name) => {
    const route = join(folder, name)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    if (statSync(route).isDirectory()) {
      return name.startsWith('.') ? [] : specs(route)
    }
    return name.endsWith('.spec.ts') && name !== 'coverage.spec.ts' ? [route] : []
  })
}

/** Los identificadores que marca cada archivo con `covers('…')`. */
function marked(files: readonly string[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    const source = readFileSync(file, 'utf8')
    for (const call of source.matchAll(/covers\(([^)]*)\)/gu)) {
      for (const literal of call[1].matchAll(/'([^']+)'/gu)) {
        const id = literal[1]
        map.set(id, [...(map.get(id) ?? []), relative(E2E, file)])
      }
    }
  }
  return map
}

// eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
const saved = JSON.parse(readFileSync(FILE_INVENTORY, 'utf8')) as { items: Element[] }
const actual = inventory()
const all = specs(E2E)
const e2e = marked(all.filter((file) => !file.includes(join('e2e', 'visual'))))
const visual = marked(all.filter((file) => file.includes(join('e2e', 'visual'))))
const VISUAL = new Set<Element['type']>(['ruta', 'dialogo', 'confirmacion', 'hoja', 'pestanas'])

test('el inventario de interfaz está al día con el código (pnpm e2e:inventory)', () => {
  const order = (a: string, b: string) => a.localeCompare(b)
  expect(saved.items.map((e) => e.id).sort(order)).toEqual(actual.map((e) => e.id).sort(order))
})

test('cada ruta, overlay, función y vista por rol tiene una prueba E2E que lo recorre', () => {
  const missing = actual.filter((element) => !e2e.has(element.id)).map((e) => e.id)
  expect(missing, `Sin prueba E2E: ${missing.join(', ')}`).toEqual([])
})

test('cada ruta y cada overlay tiene su captura de regresión visual', () => {
  const missing = actual.filter((e) => VISUAL.has(e.type) && !visual.has(e.id)).map((e) => e.id)
  expect(missing, `Sin captura visual: ${missing.join(', ')}`).toEqual([])
})

test('ninguna prueba marca un elemento que no está en el inventario', () => {
  const known = new Set(actual.map((e) => e.id))
  const unknown = [...e2e.keys(), ...visual.keys()].filter((id) => !known.has(id))
  expect(unknown).toEqual([])
})
