import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { CLOSED_CASH_REGISTER, currentOpenCash, cashRegisterSummary, cashRegisterShift } from '#jest/fixtures/cash'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import { CashView } from './CashView'

const PAGE_EMPTY = { items: [], total: 0, limit: 10, offset: 0 }
const ACTUAL = '/cash/current'
const SESSIONS = '/cash/sessions'
const OPEN = '/cash/open'
const SCREEN = '/caja'
const INITIAL = 'Efectivo inicial'
const OPEN_CASH_REGISTER = { name: 'Abrir caja' }

function openCashRegister(actual = CLOSED_CASH_REGISTER) {
  const api = server().on('get', ACTUAL, actual).on('get', SESSIONS, PAGE_EMPTY)
  signInAs()
  return { api, ...mountScreen(<CashView />, { path: SCREEN }) }
}

async function openDialog(user: ReturnType<typeof openCashRegister>['user']) {
  await user.click(await screen.findByRole('button', OPEN_CASH_REGISTER))
  return screen.findByLabelText(INITIAL)
}

describe('CashView', () => {
  it('con la caja cerrada muestra un solo botón y el formulario no ocupa la pantalla', async () => {
    openCashRegister()
    expect(await screen.findByText('La caja está cerrada')).toBeInTheDocument()
    expect(screen.queryByLabelText(INITIAL)).not.toBeInTheDocument()
  })

  it('se abre sola desde la dirección con ?accion=abrir-caja', async () => {
    server().on('get', ACTUAL, CLOSED_CASH_REGISTER).on('get', SESSIONS, PAGE_EMPTY)
    signInAs()
    mountScreen(<CashView />, { path: SCREEN, en: `${SCREEN}?accion=abrir-caja` })
    expect(await screen.findByRole('dialog', OPEN_CASH_REGISTER)).toBeInTheDocument()
  })

  it('con la caja ya abierta, ?accion=abrir-caja no abre nada y se borra de la dirección', async () => {
    server().on('get', ACTUAL, currentOpenCash()).on('get', SESSIONS, PAGE_EMPTY)
    signInAs()
    const { router } = mountScreen(<CashView />, { path: SCREEN, en: `${SCREEN}?accion=abrir-caja&otro=1` })

    expect(await screen.findByText('Turno en curso')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', OPEN_CASH_REGISTER)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('?otro=1')
    })
  })

  it('sin caja abierta ofrece abrirla y envía el monto con punto decimal', async () => {
    const { api, user } = openCashRegister()
    // Como el servidor: después de abrir, la caja actual es el turno nuevo.
    const shift = cashRegisterShift({ opening_amount: '150.50' })
    api.on('post', OPEN, () => {
      api.on('get', ACTUAL, currentOpenCash(shift))
      return shift
    })

    await user.type(await openDialog(user), '150,50')
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Turno mañana')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', OPEN_CASH_REGISTER))

    expect(await screen.findByText('Caja abierta con S/ 150.50. Ya se puede cobrar.')).toBeInTheDocument()
    expect(api.calls('post', OPEN)[0]?.body).toEqual({ opening_amount: '150.50', notes: 'Turno mañana' })
    expect(await screen.findByRole('heading', { name: 'Turno en curso' })).toBeInTheDocument()
  })

  it('un monto mal escrito no llega al servidor', async () => {
    const { api, user } = openCashRegister()

    await user.type(await openDialog(user), '15.505')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', OPEN_CASH_REGISTER))

    expect(await screen.findByText('Escribe un monto como 150 o 150.50')).toBeInTheDocument()
    expect(api.calls('post', OPEN)).toHaveLength(0)
  })

  it('con la caja abierta muestra el arqueo por medio de pago', async () => {
    const summary = cashRegisterSummary({
      sales: '80.00',
      paid_orders: 2,
      expected_cash: '200.00',
      by_method: [{ method: 'cash', method_label: 'Efectivo', payments: 2, amount: '50.00', tips: '0.00' }],
    })
    openCashRegister(currentOpenCash(cashRegisterShift({ summary })))

    const table = await screen.findByRole('table', { name: 'Por medio de pago' })
    expect(within(table).getByRole('rowheader', { name: 'Efectivo' })).toBeInTheDocument()
    expect(screen.getByText('S/ 200.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar caja/i })).toBeInTheDocument()
  })

  it('si el servidor falla, lo dice en vez de mostrar la caja vacía', async () => {
    server().on('get', ACTUAL, new ErrorResponse(500, 'Base caída')).on('get', SESSIONS, PAGE_EMPTY)
    signInAs()
    mountScreen(<CashView />)

    expect(await screen.findByText('Base caída')).toBeInTheDocument()
    expect(screen.queryByRole('button', OPEN_CASH_REGISTER)).not.toBeInTheDocument()
  })
})
