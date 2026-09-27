// Cuenta los elementos del inventario de interfaz que recorrieron las pruebas
// que pasaron, por proyecto, y lo deja en e2e/.reporte/cobertura-ui-resultado.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

interface Elemento {
  readonly id: string
  readonly tipo: string
}

const RAIZ = join(import.meta.dirname, '..')
const SALIDA = `${process.env.E2E_REPORTE ?? join(RAIZ, '.reporte')}-cobertura-ui.json`

export default class ReporteCobertura implements Reporter {
  private readonly vistos = new Map<string, Set<string>>()

  onTestEnd(prueba: TestCase, resultado: TestResult): void {
    if (resultado.status !== 'passed') {
      return
    }
    const proyecto = prueba.parent.project()?.name ?? ''
    const ids = [...prueba.annotations, ...resultado.annotations]
      .filter((nota) => nota.type === 'cubre' && nota.description !== undefined)
      .map((nota) => String(nota.description))
    const conjunto = this.vistos.get(proyecto) ?? new Set<string>()
    for (const id of ids) {
      conjunto.add(id)
    }
    this.vistos.set(proyecto, conjunto)
  }

  onEnd(): void {
    const inventario = JSON.parse(readFileSync(join(RAIZ, 'cobertura-ui.json'), 'utf8')) as {
      elementos: Elemento[]
    }
    const todos = new Set<string>()
    for (const ids of this.vistos.values()) {
      for (const id of ids) {
        todos.add(id)
      }
    }
    if (todos.size === 0) {
      return
    }
    const porTipo: Record<string, { total: number; recorridos: number; faltan: string[] }> = {}
    for (const elemento of inventario.elementos) {
      const fila = porTipo[elemento.tipo] ?? { total: 0, recorridos: 0, faltan: [] }
      fila.total += 1
      if (todos.has(elemento.id)) {
        fila.recorridos += 1
      } else {
        fila.faltan.push(elemento.id)
      }
      porTipo[elemento.tipo] = fila
    }
    const proyectos = Object.fromEntries([...this.vistos].map(([nombre, ids]) => [nombre, ids.size]))
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    mkdirSync(dirname(SALIDA), { recursive: true })
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    writeFileSync(SALIDA, `${JSON.stringify({ fecha: new Date().toISOString(), proyectos, porTipo }, null, 2)}\n`)
  }
}
