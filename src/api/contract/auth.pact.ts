import { describe, expect, it } from '@jest/globals'

import { errorStatus } from '../../services/api'
import { fetchCurrentUser, login } from '../auth'
import {
  API_PREFIX,
  bearer,
  boolean,
  connectTo,
  connectWithoutSession,
  eachLike,
  integer,
  JSON_HEADERS,
  like,
  newPact,
  regex,
  rejectionOf,
  SEED_PASSWORD,
  STATE,
  string,
} from './pactHarness'

const pact = newPact()
const LOGIN_PATH = `${API_PREFIX}/auth/login`
const OWNER = { email: 'admin@resthub.dev', password: SEED_PASSWORD }
// El mismo texto para un correo que no existe y para una contraseña
// equivocada: el mensaje no delata qué cuentas hay.
const INVALID_CREDENTIALS = 'El correo o la contraseña no son correctos.'

/** La sesión que abre el acceso y que devuelve `GET /auth/me`. */
function sessionShape() {
  return {
    user: like({
      id: integer(1),
      full_name: string('Encargado Demo'),
      email: string(OWNER.email),
      role_id: integer(1),
      role_label: string('Encargado'),
    }),
    restaurant: like({
      id: integer(1),
      name: string('Restaurante Demo'),
      // eslint-disable-next-line security/detect-unsafe-regex -- el guion separa grupos de [a-z0-9]: no hay dos formas de repartir la misma cadena, así que no retrocede; además solo valida ejemplos del pact en las pruebas
      slug: regex(/^[a-z0-9]+(-[a-z0-9]+)*$/u, 'restaurante-demo'),
      timezone: string('America/Lima'),
    }),
    permissions: eachLike(regex(/^[a-z_]+\.[a-z_]+$/u, 'orders.charge')),
    preview: boolean(false),
  }
}

describe('Contrato: acceso', () => {
  it('entra con correo y contraseña y recibe el token con la sesión', async () => {
    await pact
      .addInteraction()
      .given(STATE.ownerAccount)
      .uponReceiving('un acceso con credenciales válidas')
      .withRequest('POST', LOGIN_PATH, (req) => req.headers(JSON_HEADERS).jsonBody(OWNER))
      .willRespondWith(200, (res) =>
        res.jsonBody({
          ...sessionShape(),
          access_token: string('eyJhbGciOiJIUzI1NiJ9.sesion.firma'),
          token_type: 'bearer',
          expires_in: integer(3600),
        }),
      )
      .executeTest(async (mockServer) => {
        connectWithoutSession(mockServer)
        const response = await login(OWNER)
        expect(response.token_type).toBe('bearer')
        expect(response.restaurant.timezone).toBe('America/Lima')
        expect(response.permissions).toContain('orders.charge')
      })
  })

  it('una contraseña equivocada recibe 401 con un mensaje genérico', async () => {
    const wrong = { email: OWNER.email, password: `${SEED_PASSWORD}-equivocada` }
    await pact
      .addInteraction()
      .given(STATE.ownerAccount)
      .uponReceiving('un acceso con la contraseña equivocada')
      .withRequest('POST', LOGIN_PATH, (req) => req.headers(JSON_HEADERS).jsonBody(wrong))
      .willRespondWith(401, (res) => res.headers({ 'WWW-Authenticate': 'Bearer' }).jsonBody({ detail: INVALID_CREDENTIALS }))
      .executeTest(async (mockServer) => {
        connectWithoutSession(mockServer)
        const error = await rejectionOf(login(wrong))
        expect(errorStatus(error)).toBe(401)
      })
  })

  it('un correo que no existe recibe el mismo 401', async () => {
    const unknown = { email: 'nadie@resthub.dev', password: SEED_PASSWORD }
    await pact
      .addInteraction()
      .given(STATE.ownerAccount)
      .uponReceiving('un acceso con un correo que no existe')
      .withRequest('POST', LOGIN_PATH, (req) => req.headers(JSON_HEADERS).jsonBody(unknown))
      .willRespondWith(401, (res) => res.jsonBody({ detail: INVALID_CREDENTIALS }))
      .executeTest(async (mockServer) => {
        connectWithoutSession(mockServer)
        const error = await rejectionOf(login(unknown))
        expect(errorStatus(error)).toBe(401)
      })
  })

  it('lee la sesión abierta', async () => {
    await pact
      .addInteraction()
      .given(STATE.ownerSession)
      .uponReceiving('la lectura de la sesión propia')
      .withRequest('GET', `${API_PREFIX}/auth/me`, (req) => req.headers(bearer()))
      .willRespondWith(200, (res) => res.jsonBody(sessionShape()))
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const session = await fetchCurrentUser()
        expect(session.preview).toBe(false)
        expect(session.user.email).toBe(OWNER.email)
      })
  })
})
