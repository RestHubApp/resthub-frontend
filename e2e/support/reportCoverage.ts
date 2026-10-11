// Cuenta los elementos del inventario de interfaz que recorrieron las pruebas
// que pasaron, por proyecto, y lo deja en e2e/.report/cobertura-ui-resultado.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

interface Element {
  readonly id: string
  readonly type: string
}

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = `${process.env.E2E_REPORT ?? join(ROOT, '.reporte')}-coverage-ui.json`

export default class ReportCoverage implements Reporter {
  private readonly seen = new Map<string, Set<string>>()

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== 'passed') {
      return
    }
    const project = test.parent.project()?.name ?? ''
    const ids = [...test.annotations, ...result.annotations]
      .filter((note) => note.type === 'cubre' && note.description !== undefined)
      .map((note) => String(note.description))
    const set = this.seen.get(project) ?? new Set<string>()
    for (const id of ids) {
      set.add(id)
    }
    this.seen.set(project, set)
  }

  onEnd(): void {
    const inventory = JSON.parse(readFileSync(join(ROOT, 'coverage-ui.json'), 'utf8')) as {
      items: Element[]
    }
    const all = new Set<string>()
    for (const ids of this.seen.values()) {
      for (const id of ids) {
        all.add(id)
      }
    }
    if (all.size === 0) {
      return
    }
    const byType: Record<string, { total: number; routes: number; missing: string[] }> = {}
    for (const element of inventory.items) {
      const row = byType[element.type] ?? { total: 0, routes: 0, missing: [] }
      row.total += 1
      if (all.has(element.id)) {
        row.routes += 1
      } else {
        row.missing.push(element.id)
      }
      byType[element.type] = row
    }
    const projects = Object.fromEntries([...this.seen].map(([name, ids]) => [name, ids.size]))
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    mkdirSync(dirname(OUTPUT), { recursive: true })
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    writeFileSync(OUTPUT, `${JSON.stringify({ date: new Date().toISOString(), projects, byType }, null, 2)}\n`)
  }
}
