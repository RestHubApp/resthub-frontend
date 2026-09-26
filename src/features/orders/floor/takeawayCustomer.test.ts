import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { saveCustomer } from '../../../api/customers'
import type { Customer } from '../../../api/types'
import { withCustomer } from './takeawayCustomer'
import { EMPTY_TAKEAWAY, type TakeawayValues } from './takeawaySchema'

vi.mock('../../../api/customers', () => ({ saveCustomer: vi.fn() }))

const guardar = vi.mocked(saveCustomer)

const delivery: TakeawayValues = {
  ...EMPTY_TAKEAWAY,
  mode: 'delivery',
  customer_name: 'Ana',
  phone: '987654321',
  address: 'Av. Larco 123',
}

function conSenal(onLine: boolean) {
  vi.stubGlobal('navigator', { onLine })
}

beforeEach(() => {
  guardar.mockReset()
  conSenal(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('withCustomer', () => {
  it('agrega a la libreta al cliente nuevo de un delivery, con un plazo corto', async () => {
    guardar.mockResolvedValue({ id: 9 } as Customer)
    await expect(withCustomer(delivery)).resolves.toMatchObject({ customer_id: 9 })
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ phone: '987654321' }), undefined, {
      timeout: expect.any(Number) as number,
    })
  })

  it('sin señal ni lo intenta', async () => {
    conSenal(false)
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
    expect(guardar).not.toHaveBeenCalled()
  })

  it('si falla o vence el plazo, sigue sin el cliente', async () => {
    guardar.mockRejectedValue(new Error('timeout of 4000ms exceeded'))
    await expect(withCustomer(delivery)).resolves.toBe(delivery)
  })

  it('para llevar o con un cliente ya elegido no guarda nada', async () => {
    await withCustomer({ ...delivery, mode: 'takeaway' })
    await withCustomer({ ...delivery, customer_id: 3 })
    expect(guardar).not.toHaveBeenCalled()
  })
})
