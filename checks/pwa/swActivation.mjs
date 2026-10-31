// Comprueba en el `sw.js` compilado que un service worker nuevo se activa solo
// (`skipWaiting`) y toma las pestañas abiertas (`clientsClaim`). Sin eso, tras un
// despliegue la versión nueva queda esperando mientras la app siga abierta, y
// recargar sigue sirviendo la vieja. Uso: `node checks/pwa/swActivation.mjs dist`.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const worker = readFileSync(join(process.argv[2] ?? 'dist', 'sw.js'), 'utf8')

// Workbox escribe el aviso `SKIP_WAITING` solo cuando `skipWaiting` está apagado.
if (worker.includes('SKIP_WAITING') || !/self\.skipWaiting\(\)/u.test(worker)) {
  console.error('sw.js no se activa solo: falta workbox.skipWaiting en vite.config.ts.')
  process.exit(1)
}
if (!/clients\.claim\(\)/u.test(worker)) {
  console.error('sw.js no toma las pestañas abiertas: falta workbox.clientsClaim en vite.config.ts.')
  process.exit(1)
}
console.log('sw.js se activa solo y toma las pestañas abiertas.')
