// `pnpm a11y`: prepara los datos y corre las tres herramientas en orden, una a
// la vez, y al final arma el resumen. Necesita el backend (A11Y_API_URL, por
// defecto :8202) y el build servido con `pnpm preview` (A11Y_BASE_URL, :5202).
//
//   pnpm a11y                      todo
//   pnpm a11y axe wave             solo esas herramientas
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { ROOT } from './common.mjs'

const STEPS = {
  data: ['datos.mjs'],
  axe: ['axe.mjs'],
  'axe-sin-widget': ['axe.mjs', { A11Y_WITHOUT_WIDGET: '1', A11Y_CLASS: 'ruta' }],
  lighthouse: ['lighthouse.mjs'],
  wave: ['medir-wave.mjs'],
  keyboard: ['teclado.mjs'],
  summary: ['resumen.mjs'],
}
const orders = process.argv.slice(2)
const order = orders.length > 0 ? ['datos', ...orders.filter((p) => p !== 'datos'), 'resumen'] : Object.keys(STEPS)
let failures = 0
for (const step of [...new Set(order)]) {
  const [file, environment = {}] = STEPS[step] ?? []
  if (!file) throw new Error(`Paso desconocido: ${step}. Opciones: ${Object.keys(STEPS).join(', ')}`)
  console.log(`\n=== ${step} ===`)
  const r = spawnSync(process.execPath, [join(ROOT, file)], { stdio: 'inherit', env: { ...process.env, ...environment } })
  if (r.status !== 0) failures += 1
}
process.exit(failures > 0 ? 1 : 0)
