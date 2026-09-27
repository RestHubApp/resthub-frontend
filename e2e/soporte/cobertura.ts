// Marca qué elementos del inventario de interfaz (`e2e/cobertura-ui.json`)
// recorre una prueba. `cobertura.spec.ts` comprueba que cada elemento tenga al
// menos una prueba que lo marque, y el reporte `reporteCobertura.ts` cuenta
// los que marcaron las pruebas que pasaron.
import { test } from '@playwright/test'

export function cubre(...ids: string[]): void {
  for (const id of ids) {
    test.info().annotations.push({ type: 'cubre', description: id })
  }
}
