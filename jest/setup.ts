// Se carga antes de cada archivo de prueba (setupFiles).
//
// `import.meta.env` con los valores de Vite en modo de prueba: BASE_URL '/',
// DEV verdadero y las VITE_* que haya en el entorno del proceso.
const vite: Record<string, unknown> = { BASE_URL: '/', MODE: 'test', DEV: true, PROD: false, SSR: false }
for (const [clave, valor] of Object.entries(process.env)) {
  if (clave.startsWith('VITE_')) {
    vite[clave] = valor
  }
}
// Los eventos del logger no llenan la salida de las pruebas, salvo que se pida
// un nivel con VITE_LOG_LEVEL.
vite.VITE_LOG_LEVEL ??= 'fatal'
Object.defineProperty(globalThis, '__VITE_ENV__', { value: vite, writable: true, configurable: true })
