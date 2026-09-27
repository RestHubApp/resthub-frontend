// `pnpm a11y`: prepara los datos y corre las tres herramientas en orden, una a
// la vez, y al final arma el resumen. Necesita el backend (A11Y_API_URL, por
// defecto :8202) y el build servido con `pnpm preview` (A11Y_BASE_URL, :5202).
//
//   pnpm a11y                      todo
//   pnpm a11y axe wave             solo esas herramientas
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { RAIZ } from './comun.mjs'

const PASOS = {
  datos: ['datos.mjs'],
  axe: ['axe.mjs'],
  'axe-sin-widget': ['axe.mjs', { A11Y_SIN_WIDGET: '1', A11Y_CLASE: 'ruta' }],
  lighthouse: ['lighthouse.mjs'],
  wave: ['medir-wave.mjs'],
  teclado: ['teclado.mjs'],
  resumen: ['resumen.mjs'],
}
const pedidos = process.argv.slice(2)
const orden = pedidos.length > 0 ? ['datos', ...pedidos.filter((p) => p !== 'datos'), 'resumen'] : Object.keys(PASOS)
let fallos = 0
for (const paso of [...new Set(orden)]) {
  const [archivo, entorno = {}] = PASOS[paso] ?? []
  if (!archivo) throw new Error(`Paso desconocido: ${paso}. Opciones: ${Object.keys(PASOS).join(', ')}`)
  console.log(`\n=== ${paso} ===`)
  const r = spawnSync(process.execPath, [join(RAIZ, archivo)], { stdio: 'inherit', env: { ...process.env, ...entorno } })
  if (r.status !== 0) fallos += 1
}
process.exit(fallos > 0 ? 1 : 0)
