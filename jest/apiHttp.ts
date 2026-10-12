// Manejadores de MSW tipados con el contrato (`src/api/schema.d.ts`): la ruta
// debe existir en el esquema y la respuesta simulada debe cumplir el cuerpo que
// el esquema declara para ese código. Para pruebas nuevas:
//
//   mswServer.use(apiHttp.get('/api/v1/tables', ({ response }) => response(200).json([])))
import { createOpenApiHttp } from 'openapi-msw'

import type { ApiPaths } from '../src/api/types'

export const apiHttp = createOpenApiHttp<ApiPaths>({ baseUrl: '*' })
