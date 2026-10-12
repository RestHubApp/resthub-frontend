// Peticiones reales de `src/api`, una por cada combinación que le importa al
// cliente HTTP (`src/services/api.ts`): lectura o escritura, de restaurante o
// de plataforma, con o sin credencial. Las pruebas de `services/` no pueden
// importar la capa `api`; las piden por aquí.
import { QueryClient } from '@tanstack/react-query'

import { anonymizeCustomer } from '../src/api/customers'
import { exchangePreviewCode, renewSession } from '../src/api/auth'
import { platformSandboxQuery } from '../src/api/platform'
import { fetchTables } from '../src/api/tables'

/** GET /api/v1/tables: una lectura de restaurante. */
export function readRestaurant(): Promise<unknown> {
  return fetchTables()
}

/** POST /api/v1/customers/1/anonymize: una escritura de restaurante. */
export function writeRestaurant(): Promise<unknown> {
  return anonymizeCustomer(1)
}

/** GET /api/v1/platform/sandbox: una lectura de plataforma. */
export function readPlatform(): Promise<unknown> {
  return new QueryClient().query(platformSandboxQuery)
}

/** POST /api/v1/auth/refresh: una escritura con credencial. */
export function writeSession(): Promise<unknown> {
  return renewSession()
}

/** POST /api/v1/auth/preview: sale siempre sin credencial. */
export function writeWithoutCredential(): Promise<unknown> {
  return exchangePreviewCode({ code: 'abc' })
}
