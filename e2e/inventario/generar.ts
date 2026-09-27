// Reescribe e2e/cobertura-ui.json con el inventario actual de la interfaz.
// Uso: pnpm e2e:inventario
import { writeFileSync } from 'node:fs'

import { ARCHIVO_INVENTARIO, inventario } from './inventario.ts'

const elementos = inventario()
const porTipo: Record<string, number> = {}
for (const elemento of elementos) {
  porTipo[elemento.tipo] = (porTipo[elemento.tipo] ?? 0) + 1
}
// eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
writeFileSync(ARCHIVO_INVENTARIO, `${JSON.stringify({ total: elementos.length, porTipo, elementos }, null, 2)}\n`)
console.warn(`Inventario: ${String(elementos.length)} elementos`, porTipo)
