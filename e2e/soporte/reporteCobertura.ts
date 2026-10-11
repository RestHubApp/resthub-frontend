// Cuenta los elementos del inventario de interfaz que recorrieron las pruebas
// que pasaron, por proyecto, y lo deja en e2e/.reporte/cobertura-ui-resultado.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

interface Element {
  readonly id: string
  readonly tipo: string
}

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = `${process.env.E2E_REPORTE ?? join(ROOT, '.reporte')}-cobertura-ui.json`

export default class ReportCoverage implements Reporter {
  private readonly vistos = new Map<string, Set<string>>()

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== 'passed') {
      return
    }
    const project = test.parent.project()?.name ?? ''
    const ids = [...test.annotations, ...result.annotations]
      .filter((note) => note.type === 'cubre' && note.description !== undefined)
      .map((note) => String(note.description))
    const set = this.vistos.get(project) ?? new Set<string>()
    for (const id of ids) {
      set.add(id)
    }
    this.vistos.set(project, set)
  }

  onEnd(): void {
    const inventory = JSON.parse(readFileSync(join(ROOT, 'cobertura-ui.json'), 'utf8')) as {
      elementos: Element[]
    }
    const all = new Set<string>()
    for (const ids of this.vistos.values()) {
      for (const id of ids) {
        all.add(id)
      }
    }
    if (all.size === 0) {
      return
    }
    const byType: Record<string, { total: number; recorridos: number; faltan: string[] }> = {}
    for (const element of inventory.elementos) {
      const row = byType[element.tipo] ?? { total: 0, recorridos: 0, faltan: [] }
      row.total += 1
      if (all.has(element.id)) {
        row.recorridos += 1
      } else {
        row.faltan.push(element.id)
      }
      byType[element.tipo] = row
    }
    const projects = Object.fromEntries([...this.vistos].map(([name, ids]) => [name, ids.size]))
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    mkdirSync(dirname(OUTPUT), { recursive: true })
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    writeFileSync(OUTPUT, `${JSON.stringify({ fecha: new Date().toISOString(), proyectos: projects, porTipo: byType }, null, 2)}\n`)
  }
}
