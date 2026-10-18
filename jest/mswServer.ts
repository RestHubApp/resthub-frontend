// El servidor de MSW de las pruebas: intercepta el `fetch` de la aplicación, así
// que se ejercita el cliente real (`openapi-fetch` y `src/services/api.ts`) y
// solo la red es falsa.
//
// Se enciende en `jest/setupDom.ts` con `onUnhandledFrame: 'error'` (una
// petición sin manejador falla la prueba) y se resetea después de cada una.
// Las pruebas declaran respuestas con `server()` de `#jest/harness` o, tipadas
// con el contrato, con `apiHttp` de `#jest/apiHttp`.
import { http } from 'msw'
import { setupServer } from 'msw/node'

// El canal de avisos queda abierto sin eventos, como una conexión que todavía
// no responde; una prueba que necesita avisos reales declara su propio manejador.
const idleEventChannel = http.get('*/api/v1/events', () => new Promise<never>(() => undefined))

export const mswServer = setupServer(idleEventChannel)
