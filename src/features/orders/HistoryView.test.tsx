import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor } from '#jest/harness'
import type { OrderResponse, PermissionCode } from '../../api/types'
import { todayIn } from '../../services/format'
import HistoryView from './HistoryView'

const PEDIDOS = '/orders'

function pagina(items: OrderResponse[], total = items.length) {
  return { items, total, limit: 25, offset: 0 }
}

const COBRADO = pedido({ status: 'paid', payment_method_label: 'Yape', notes: 'Sin ají', paid_at: '2026-09-26T18:00:00Z' })

function historial(respuesta: unknown = pagina([COBRADO]), permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO) {
  const api = servidor()
    .on('get', PEDIDOS, respuesta)
    .on('get', '/staff', {
      items: [{ id: 8, full_name: 'Luis Paz', email: 'l@r.dev', is_active: true, role_id: 2, role_label: 'Mesero', created_at: '' }],
      total: 1,
    })
  entrarComo(permisos)
  return { api, ...montar(<HistoryView />, { path: '/tablero/historial' }) }
}

function ultimaConsulta(api: ReturnType<typeof servidor>) {
  return api.llamadas('get', PEDIDOS).at(-1)?.params
}

describe('HistoryView', () => {
  it('arranca con los pedidos de hoy en el local y los lista con su pago', async () => {
    const { api } = historial()

    const fila = (await screen.findByText('#34')).closest('tr') as HTMLElement
    expect(within(fila).getByText('Mesa 3')).toBeInTheDocument()
    expect(within(fila).getByText('Yape')).toBeInTheDocument()
    expect(within(fila).getByText('Pagado')).toBeInTheDocument()
    const hoy = todayIn('America/Lima')
    expect(ultimaConsulta(api)).toMatchObject({ date_from: hoy, date_to: hoy, status: null, limit: 25, offset: 0 })
    expect(screen.getByText('1 en total')).toBeInTheDocument()
  })

  it('el detalle de una fila muestra los platos, el cobro y la nota', async () => {
    const { user } = historial()

    await user.click(await screen.findByRole('button', { name: 'Ver el detalle del pedido #34' }))

    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Pagado con')).toBeInTheDocument()
    expect(screen.getByText('Nota: Sin ají')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar el detalle del pedido #34' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('filtrar por estado, tipo y mesero vuelve a pedir con esos filtros', async () => {
    const { api, user } = historial()

    await screen.findByText('#34')
    await user.selectOptions(screen.getByLabelText('Estado'), 'Cancelado')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Delivery')
    await user.selectOptions(screen.getByLabelText('Mesero'), await screen.findByRole('option', { name: 'Luis Paz' }))
    await user.clear(screen.getByLabelText('Desde'))

    expect(ultimaConsulta(api)).toMatchObject({ status: ['cancelled'], type: 'delivery', waiter_id: 8, date_from: null })
  })

  it('sin permiso sobre el personal no ofrece filtrar por mesero', async () => {
    const { api } = historial(pagina([COBRADO]), ['orders.read_all'])

    await screen.findByText('#34')
    expect(screen.queryByLabelText('Mesero')).not.toBeInTheDocument()
    expect(api.llamadas('get', '/staff')).toHaveLength(0)
  })

  it('pagina en el servidor cuando hay más de 25', async () => {
    const { api, user } = historial(pagina([COBRADO], 60))

    await user.click(await screen.findByRole('button', { name: /Siguiente/u }))

    expect(ultimaConsulta(api)).toMatchObject({ offset: 25 })
  })

  it('sin resultados lo dice', async () => {
    historial(pagina([]))
    expect(await screen.findByText('Ningún pedido coincide con los filtros.')).toBeInTheDocument()
  })

  it('si el servidor falla muestra su mensaje', async () => {
    historial(new RespuestaDeError(500, 'Consulta muy pesada'))

    expect(await screen.findByText('Consulta muy pesada')).toBeInTheDocument()
  })
})
