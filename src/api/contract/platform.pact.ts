import { describe, expect, it } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import { PLATFORM_PAGE_SIZE, platformRestaurantsQuery } from '../platform'
import {
  API_PREFIX,
  bearer,
  boolean,
  connectTo,
  eachLike,
  integer,
  isoDatetime,
  newPact,
  regex,
  STATE,
  string,
} from './pactHarness'

const pact = newPact()
const PARAMS = { limit: PLATFORM_PAGE_SIZE, offset: 0 }

describe('Contrato: administración del sistema', () => {
  it('lista los restaurantes con la sesión de plataforma', async () => {
    await pact
      .addInteraction()
      .given(STATE.platformSession)
      .uponReceiving('la lista de restaurantes de la plataforma')
      .withRequest('GET', `${API_PREFIX}/platform/restaurants`, (req) =>
        req.headers(bearer()).query({ limit: String(PARAMS.limit), offset: String(PARAMS.offset) }),
      )
      .willRespondWith(200, (res) =>
        res.jsonBody({
          items: eachLike({
            id: integer(1),
            name: string('Restaurante Demo'),
            // eslint-disable-next-line security/detect-unsafe-regex -- el guion separa grupos de [a-z0-9]: no hay dos formas de repartir la misma cadena, así que no retrocede; además solo valida ejemplos del pact en las pruebas
            slug: regex(/^[a-z0-9]+(-[a-z0-9]+)*$/u, 'restaurante-demo'),
            timezone: string('America/Lima'),
            is_active: boolean(true),
            created_at: isoDatetime(),
            staff_count: integer(3),
            active_staff_count: integer(3),
          }),
          total: integer(1),
        }),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        // La misma consulta que usa la pantalla, por el mismo camino que TanStack Query.
        const page = await new QueryClient().query(platformRestaurantsQuery(PARAMS))
        expect(page.items[0]?.slug).toBe('restaurante-demo')
        expect(page.total).toBeGreaterThanOrEqual(1)
      })
  })
})
