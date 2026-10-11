import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cashRegisterSummary, cashRegisterShift } from '#jest/fixtures/cash'
import { signInAs, handleMount, ErrorResponse, server } from '#jest/harness'
import type { CashSession } from '@/api/types'
import { CloseCashForm } from './CloseCashForm'

const CASH = 'Efectivo contado'
const CLOSE = { name: 'Cerrar caja' }

/** «Cerrar caja» y, en la confirmación, «Cerrar caja» otra vez. */
async function closeAndConfirm(user: ReturnType<typeof handleMount>['user']) {
  await user.click(screen.getByRole('button', CLOSE))
  const confirmation = await screen.findByRole('alertdialog', { name: '¿Cerrar la caja?' })
  await user.click(within(confirmation).getByRole('button', CLOSE))
}
const CLOSE_URL = '/cash/close'

function closeShift(shift: CashSession = cashRegisterShift({ summary: cashRegisterSummary({ expected_cash: '200.00' }) })) {
  const api = server().on('get', '/cash/current', { is_open: true, session: shift })
  signInAs()
  const onClosed = jest.fn<(session: CashSession) => void>()
  return { api, onClosed, ...handleMount(<CloseCashForm session={shift} onClosed={onClosed} />) }
}

describe('CloseCashForm', () => {
  it('muestra lo esperado y la diferencia mientras se cuenta el cajón', async () => {
    const { user } = closeShift()
    expect(screen.getByText('Esperado: S/ 200.00')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()

    const field = screen.getByLabelText(CASH)
    await user.type(field, '196')
    expect(screen.getByText('Faltan S/ 4.00')).toBeInTheDocument()

    await user.clear(field)
    await user.type(field, '202,5')
    expect(screen.getByText('Sobran S/ 2.50')).toBeInTheDocument()

    await user.clear(field)
    await user.type(field, '200')
    expect(screen.getByText('Cuadra')).toBeInTheDocument()
  })

  it('cierra con el monto contado y avisa cuánto faltó', async () => {
    const { api, user, onClosed } = closeShift()
    const closed = cashRegisterShift({ is_open: false, counted_cash: '196.00', difference: '-4.00' })
    api.on('post', CLOSE_URL, closed)

    await user.type(screen.getByLabelText(CASH), '196,00')
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Faltó sencillo')
    await closeAndConfirm(user)

    expect(await screen.findByText('Caja cerrada. Faltan S/ 4.00.')).toBeInTheDocument()
    expect(api.calls('post', CLOSE_URL)[0]?.body).toEqual({ counted_cash: '196.00', notes: 'Faltó sencillo' })
    expect(onClosed).toHaveBeenCalledWith(closed)
  })

  it('sin monto no cierra y pide escribirlo', async () => {
    const { api, user, onClosed } = closeShift()
    await user.click(screen.getByRole('button', CLOSE))

    expect(await screen.findByText('Escribe el monto')).toBeInTheDocument()
    expect(api.calls('post', CLOSE_URL)).toHaveLength(0)
    expect(onClosed).not.toHaveBeenCalled()
  })

  it('avisa de los pedidos sin cobrar, en singular y en plural', () => {
    closeShift(cashRegisterShift({ open_orders: 1 }))
    expect(screen.getByRole('status')).toHaveTextContent('Hay 1 pedido sin cobrar')
  })

  it('con varios pedidos abiertos los cuenta', () => {
    closeShift(cashRegisterShift({ open_orders: 3 }))
    expect(screen.getByRole('status')).toHaveTextContent('Hay 3 pedidos sin cobrar')
  })

  it('si el servidor rechaza el cierre, muestra su motivo', async () => {
    const { api, user, onClosed } = closeShift()
    api.on('post', CLOSE_URL, new ErrorResponse(409, 'La caja ya estaba cerrada'))

    await user.type(screen.getByLabelText(CASH), '200')
    await closeAndConfirm(user)

    expect(await screen.findByText('La caja ya estaba cerrada')).toBeInTheDocument()
    expect(onClosed).not.toHaveBeenCalled()
  })
})
