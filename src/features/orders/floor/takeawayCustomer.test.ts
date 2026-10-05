/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import { AxiosError, AxiosHeaders } from 'axios'

import { saveCustomer } from '../../../api/customers'
import type { Customer } from '../../../api/types'
import { withCustomer } from './takeawayCustomer'
import { EMPTY_TAKEAWAY, type TakeawayValues } from './takeawaySchema'

jest.mock('../../../api/customers', () => ({ saveCustomer: jest.fn() }))

const guardar = jest.mocked(saveCustomer)

const delivery: TakeawayValues = {
  ...EMPTY_TAKEAWAY,
  mode: 'delivery',
  customer_name: 'Ana',
  phone: '987654321',
  address: 'Av. Larco 123',
}

function conSenal(onLine: boolean) {
  stubGlobal('navigator', { onLine })
}

beforeEach(() => {
  guardar.mockReset()
  conSenal(true)
})

afterEach(() => {
  unstubAllGlobals()
})

describe('withCustomer', () => {
  it('agrega a la libreta al cliente nuevo de un delivery, con un plazo corto', async () => {
    guardar.mockResolvedValue({ id: 9 } as Customer)
    await expect(withCustomer(delivery)).resolves.toMatchObject({ customer_id: 9 })
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ phone: '987654321' }), undefined, {
      timeout: expect.any(Number) as unknown as number,
    })
  })

  it('sin señal ni lo intenta', async () => {
    conSenal(false)
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
    expect(guardar).not.toHaveBeenCalled()
  })

  it('si falla o vence el plazo, el formulario se entera y no pierde los datos', async () => {
    guardar.mockRejectedValue(new Error('timeout of 4000ms exceeded'))
    await expect(withCustomer(delivery)).rejects.toThrow('timeout of 4000ms exceeded')
  })

  it('si el teléfono ya está en la libreta, sigue sin el alta y el servidor lo reconoce', async () => {
    const config = { headers: new AxiosHeaders() }
    guardar.mockRejectedValue(
      new AxiosError('conflicto', 'ERR_BAD_REQUEST', config, undefined, {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config,
        data: { detail: 'El teléfono 987654321 ya es de Ana.' },
      }),
    )
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
  })

  it('para llevar o con un cliente ya elegido no guarda nada', async () => {
    await withCustomer({ ...delivery, mode: 'takeaway' })
    await withCustomer({ ...delivery, customer_id: 3 })
    expect(guardar).not.toHaveBeenCalled()
  })
})
