import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { buildOrder } from '#jest/fixtures/charge'
import { signInAs, mountScreen, PERMISSIONS_OWNER, ErrorResponse, server } from '#jest/harness'
import type { OrderResponse, PermissionCode } from '@/api/types'
import { todayIn } from '@/services/format'
import { HistoryView } from './HistoryView'

const ORDERS = '/orders'

function page(items: OrderResponse[], total = items.length) {
  return { items, total, limit: 25, offset: 0 }
}

const CHARGED = buildOrder({ status: 'paid', payment_method_label: 'Yape', notes: 'Sin ají', paid_at: '2026-09-26T18:00:00Z' })

function history(response: unknown = page([CHARGED]), permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  const api = server()
    .on('get', ORDERS, response)
    .on('get', '/staff', {
      items: [{ id: 8, full_name: 'Luis Paz', email: 'l@r.dev', is_active: true, role_id: 2, role_label: 'Mesero', created_at: '' }],
      total: 1,
    })
  signInAs(permissions)
  return { api, ...mountScreen(<HistoryView />, { path: '/tablero/historial' }) }
}

function lastQuery(api: ReturnType<typeof server>) {
  return api.calls('get', ORDERS).at(-1)?.params
}

describe('HistoryView', () => {
  it('arranca con los pedidos de hoy en el local y los lista con su pago', async () => {
    const { api } = history()

    const row = await screen.findByRole('row', { name: /#34/u })
    expect(within(row).getByText('Mesa 3')).toBeInTheDocument()
    expect(within(row).getByText('Yape')).toBeInTheDocument()
    expect(within(row).getByText('Pagado')).toBeInTheDocument()
    const today = todayIn('America/Lima')
    expect(lastQuery(api)).toMatchObject({ date_from: today, date_to: today, limit: '25', offset: '0' })
    expect(screen.getByText('1 en total')).toBeInTheDocument()
  })

  it('el detalle de una fila muestra los platos, el cobro y la nota', async () => {
    const { user } = history()

    await user.click(await screen.findByRole('button', { name: 'Ver el detalle del pedido #34' }))

    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Pagado con')).toBeInTheDocument()
    expect(screen.getByText('Nota: Sin ají')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar el detalle del pedido #34' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('filtrar por estado, tipo y mesero vuelve a pedir con esos filtros', async () => {
    const { api, user } = history()

    await screen.findByText('#34')
    await user.selectOptions(screen.getByLabelText('Estado'), 'Cancelado')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Delivery')
    await user.selectOptions(screen.getByLabelText('Mesero'), await screen.findByRole('option', { name: 'Luis Paz' }))
    await user.clear(screen.getByLabelText('Desde'))

    expect(lastQuery(api)).toMatchObject({ status: 'cancelled', type: 'delivery', waiter_id: '8' })
  })

  it('sin permiso sobre el personal no ofrece filtrar por mesero', async () => {
    const { api } = history(page([CHARGED]), ['orders.read_all'])

    await screen.findByText('#34')
    expect(screen.queryByLabelText('Mesero')).not.toBeInTheDocument()
    expect(api.calls('get', '/staff')).toHaveLength(0)
  })

  it('pagina en el servidor cuando hay más de 25', async () => {
    const { api, user } = history(page([CHARGED], 60))

    await user.click(await screen.findByRole('button', { name: /Siguiente/u }))

    expect(lastQuery(api)).toMatchObject({ offset: '25' })
  })

  it('sin resultados lo dice', async () => {
    history(page([]))
    expect(await screen.findByText('Ningún pedido coincide con los filtros.')).toBeInTheDocument()
  })

  it('si el servidor falla muestra su mensaje', async () => {
    history(new ErrorResponse(500, 'Consulta muy pesada'))

    expect(await screen.findByText('Consulta muy pesada')).toBeInTheDocument()
  })
})
