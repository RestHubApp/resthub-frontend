// Reescribe e2e/cobertura-ui.json con el inventario actual de la interfaz.
// Uso: pnpm e2e:inventario
import { writeFileSync } from 'node:fs'

import { ARCHIVO_INVENTARIO, inventario } from './inventario.ts'

const elementos = inventario()
const porTipo: Record<string, number> = {}
for (const elemento of elementos) {
  porTipo[elemento.tipo] = (porTipo[elemento.tipo] ?? 0) + 1
}
writeFileSync(ARCHIVO_INVENTARIO, `${JSON.stringify({ total: elementos.length, porTipo, elementos }, null, 2)}\n`)
console.warn(`Inventario: ${String(elementos.length)} elementos`, porTipo)
