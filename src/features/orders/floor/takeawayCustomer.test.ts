/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { HttpResponse } from 'msw'

import { apiHttp } from '#jest/apiHttp'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'
import { mswServer } from '#jest/mswServer'

import type { CustomerRequest } from '@/api/types'
import { withCustomer } from './takeawayCustomer'
import { EMPTY_TAKEAWAY, type TakeawayValues } from './takeawaySchema'

const saved: CustomerRequest[] = []

const CUSTOMER = {
  id: 9, name: 'Ana', phone: '987654321', email: '', address: 'Av. Larco 123', reference: '', notes: '',
  consent_at: null, consent_version: null, created_at: '2026-10-01T10:00:00Z', is_frequent: false,
  last_visit: null, visits: 0, spent: '0.00', average_ticket: '0.00', recent_orders: [],
}

type Answer = 'created' | 'phoneTaken' | 'cut'

// El alta de clientes, tipada con el contrato: 201, 409 si el teléfono ya existe o un corte de red.
function customersAnswer(answer: Answer): void {
  mswServer.use(
    apiHttp.post('/api/v1/customers', async ({ request, response }) => {
      saved.push(await request.clone().json())
      if (answer === 'cut') return HttpResponse.error()
      if (answer === 'phoneTaken') {
        return response(409).json({ detail: 'El teléfono 987654321 ya es de Ana.', code: 'phone_taken' })
      }
      return response(201).json(CUSTOMER)
    }),
  )
}

const delivery: TakeawayValues = {
  ...EMPTY_TAKEAWAY,
  mode: 'delivery',
  customer_name: 'Ana',
  phone: '987654321',
  address: 'Av. Larco 123',
  consent: true,
}

function withSignal(onLine: boolean) {
  stubGlobal('navigator', { onLine })
}

beforeEach(() => {
  saved.length = 0
  customersAnswer('created')
  withSignal(true)
})

afterEach(() => {
  unstubAllGlobals()
})

describe('withCustomer', () => {
  it('agrega a la libreta al cliente nuevo de un delivery, con un plazo corto', async () => {
    await expect(withCustomer(delivery)).resolves.toMatchObject({ customer_id: 9 })
    expect(saved).toMatchObject([{ phone: '987654321', consent: true }])
  })

  it('sin el consentimiento del cliente no lo guarda y el pedido sigue', async () => {
    await expect(withCustomer({ ...delivery, consent: false })).resolves.toMatchObject({ customer_id: null })
    expect(saved).toEqual([])
  })

  it('sin señal ni lo intenta', async () => {
    withSignal(false)
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
    expect(saved).toEqual([])
  })

  it('si falla o vence el plazo, el formulario se entera y no pierde los datos', async () => {
    customersAnswer('cut')
    await expect(withCustomer(delivery)).rejects.toMatchObject({ reason: 'network' })
  })

  it('si el teléfono ya está en la libreta, sigue sin el alta y el servidor lo reconoce', async () => {
    customersAnswer('phoneTaken')
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
  })

  it('para llevar o con un cliente ya elegido no guarda nada', async () => {
    await withCustomer({ ...delivery, mode: 'takeaway' })
    await withCustomer({ ...delivery, customer_id: 3 })
    expect(saved).toEqual([])
  })
})
