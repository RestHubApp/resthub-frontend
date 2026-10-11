// Reescribe e2e/cobertura-ui.json con el inventario actual de la interfaz.
// Uso: pnpm e2e:inventario
import { writeFileSync } from 'node:fs'

import { FILE_INVENTORY, inventory } from './inventario.ts'

const items = inventory()
const byType: Record<string, number> = {}
for (const element of items) {
  byType[element.tipo] = (byType[element.tipo] ?? 0) + 1
}
// eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
writeFileSync(FILE_INVENTORY, `${JSON.stringify({ total: items.length, porTipo: byType, elementos: items }, null, 2)}\n`)
console.warn(`Inventario: ${String(items.length)} elementos`, byType)
