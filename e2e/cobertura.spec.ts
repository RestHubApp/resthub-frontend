// Falla si el inventario de la interfaz quedó viejo o si algún elemento no
// tiene una prueba que lo recorra. No abre el navegador: lee el código.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { expect, test } from '@playwright/test'

import { ARCHIVO_INVENTARIO, type Elemento, inventario } from './inventario/inventario'

const E2E = import.meta.dirname

function specs(carpeta: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    if (statSync(ruta).isDirectory()) {
      return nombre.startsWith('.') ? [] : specs(ruta)
    }
    return nombre.endsWith('.spec.ts') && nombre !== 'cobertura.spec.ts' ? [ruta] : []
  })
}

/** Los identificadores que marca cada archivo con `cubre('…')`. */
function marcados(archivos: readonly string[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>()
  for (const archivo of archivos) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    const fuente = readFileSync(archivo, 'utf8')
    for (const llamada of fuente.matchAll(/cubre\(([^)]*)\)/gu)) {
      for (const literal of llamada[1].matchAll(/'([^']+)'/gu)) {
        const id = literal[1]
        mapa.set(id, [...(mapa.get(id) ?? []), relative(E2E, archivo)])
      }
    }
  }
  return mapa
}

// eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
const guardado = JSON.parse(readFileSync(ARCHIVO_INVENTARIO, 'utf8')) as { elementos: Elemento[] }
const actual = inventario()
const todos = specs(E2E)
const e2e = marcados(todos.filter((archivo) => !archivo.includes(join('e2e', 'visual'))))
const visual = marcados(todos.filter((archivo) => archivo.includes(join('e2e', 'visual'))))
const VISUALES = new Set<Elemento['tipo']>(['ruta', 'dialogo', 'confirmacion', 'hoja', 'pestanas'])

test('el inventario de interfaz está al día con el código (pnpm e2e:inventario)', () => {
  const orden = (a: string, b: string) => a.localeCompare(b)
  expect(guardado.elementos.map((e) => e.id).sort(orden)).toEqual(actual.map((e) => e.id).sort(orden))
})

test('cada ruta, overlay, función y vista por rol tiene una prueba E2E que lo recorre', () => {
  const faltan = actual.filter((elemento) => !e2e.has(elemento.id)).map((e) => e.id)
  expect(faltan, `Sin prueba E2E: ${faltan.join(', ')}`).toEqual([])
})

test('cada ruta y cada overlay tiene su captura de regresión visual', () => {
  const faltan = actual.filter((e) => VISUALES.has(e.tipo) && !visual.has(e.id)).map((e) => e.id)
  expect(faltan, `Sin captura visual: ${faltan.join(', ')}`).toEqual([])
})

test('ninguna prueba marca un elemento que no está en el inventario', () => {
  const conocidos = new Set(actual.map((e) => e.id))
  const desconocidos = [...e2e.keys(), ...visual.keys()].filter((id) => !conocidos.has(id))
  expect(desconocidos).toEqual([])
})
