// Marca qué elementos del inventario de interfaz (`e2e/coverage-ui.json`)
// recorre una prueba. `coverage.spec.ts` comprueba que cada elemento tenga al
// menos una prueba que lo marque, y el reporte `reportCoverage.ts` cuenta
// los que marcaron las pruebas que pasaron.
import { test } from '@playwright/test'

export function covers(...ids: string[]): void {
  for (const id of ids) {
    test.info().annotations.push({ type: 'covers', description: id })
  }
}
