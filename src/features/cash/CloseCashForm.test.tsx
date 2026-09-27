import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { resumenDeCaja, turnoDeCaja } from '#jest/fixtures/cash'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { CashSession } from '../../api/types'
import CloseCashForm from './CloseCashForm'

const CONTADO = 'Efectivo contado'
const CERRAR = { name: 'Cerrar caja' }
const CERRAR_URL = '/cash/close'

function cerrarTurno(turno: CashSession = turnoDeCaja({ summary: resumenDeCaja({ expected_cash: '200.00' }) })) {
  const api = servidor().on('get', '/cash/current', { is_open: true, session: turno })
  entrarComo()
  const onClosed = jest.fn<(session: CashSession) => void>()
  return { api, onClosed, ...montar(<CloseCashForm session={turno} onClosed={onClosed} />) }
}

describe('CloseCashForm', () => {
  it('muestra lo esperado y la diferencia mientras se cuenta el cajón', async () => {
    const { user } = cerrarTurno()
    expect(screen.getByText('Esperado: S/ 200.00')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()

    const campo = screen.getByLabelText(CONTADO)
    await user.type(campo, '196')
    expect(screen.getByText('Faltan S/ 4.00')).toBeInTheDocument()

    await user.clear(campo)
    await user.type(campo, '202,5')
    expect(screen.getByText('Sobran S/ 2.50')).toBeInTheDocument()

    await user.clear(campo)
    await user.type(campo, '200')
    expect(screen.getByText('Cuadra')).toBeInTheDocument()
  })

  it('cierra con el monto contado y avisa cuánto faltó', async () => {
    const { api, user, onClosed } = cerrarTurno()
    const cerrada = turnoDeCaja({ is_open: false, counted_cash: '196.00', difference: '-4.00' })
    api.on('post', CERRAR_URL, cerrada)

    await user.type(screen.getByLabelText(CONTADO), '196,00')
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Faltó sencillo')
    await user.click(screen.getByRole('button', CERRAR))

    expect(await screen.findByText('Caja cerrada. Faltan S/ 4.00.')).toBeInTheDocument()
    expect(api.llamadas('post', CERRAR_URL)[0]?.body).toEqual({ counted_cash: '196.00', notes: 'Faltó sencillo' })
    expect(onClosed).toHaveBeenCalledWith(cerrada)
  })

  it('sin monto no cierra y pide escribirlo', async () => {
    const { api, user, onClosed } = cerrarTurno()
    await user.click(screen.getByRole('button', CERRAR))

    expect(await screen.findByText('Escribe el monto')).toBeInTheDocument()
    expect(api.llamadas('post', CERRAR_URL)).toHaveLength(0)
    expect(onClosed).not.toHaveBeenCalled()
  })

  it('avisa de los pedidos sin cobrar, en singular y en plural', () => {
    cerrarTurno(turnoDeCaja({ open_orders: 1 }))
    expect(screen.getByRole('status')).toHaveTextContent('Hay 1 pedido sin cobrar')
  })

  it('con varios pedidos abiertos los cuenta', () => {
    cerrarTurno(turnoDeCaja({ open_orders: 3 }))
    expect(screen.getByRole('status')).toHaveTextContent('Hay 3 pedidos sin cobrar')
  })

  it('si el servidor rechaza el cierre, muestra su motivo', async () => {
    const { api, user, onClosed } = cerrarTurno()
    api.on('post', CERRAR_URL, new RespuestaDeError(409, 'La caja ya estaba cerrada'))

    await user.type(screen.getByLabelText(CONTADO), '200')
    await user.click(screen.getByRole('button', CERRAR))

    expect(await screen.findByText('La caja ya estaba cerrada')).toBeInTheDocument()
    expect(onClosed).not.toHaveBeenCalled()
  })
})
