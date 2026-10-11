import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { handleOrder } from '#jest/fixtures/cobro'
import { signInAs, handleMount, PERMISSIONS_OWNER, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import type { OrderResponse, PermissionCode } from '@/api/types'
import { OrderDetailView } from './OrderDetailView'

const ORDER = '/orders/12'
const CHARGE = { name: 'Cobrar' }
const CANCEL = { name: 'Cancelar pedido' }

function open(order: OrderResponse | ErrorResponse, permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  const api = server().on('get', ORDER, order).on('get', '/cash/current', { is_open: true, session: null })
  signInAs(permissions)
  return { api, ...handleMount(<OrderDetailView />, { path: '/pedidos/:orderId', en: '/pedidos/12' }) }
}

describe('OrderDetailView: lo que se lee', () => {
  it('muestra número, lugar, estado, mesero, total y los platos con precio', async () => {
    open(handleOrder({ notes: 'Mesa de cumpleaños' }))

    expect(await screen.findByRole('heading', { name: 'Pedido #34', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
    expect(screen.getByText('Servido, por cobrar')).toBeInTheDocument()
    expect(screen.getByText(/Ana Torres · abierto a las .* · 2 platos/u)).toBeInTheDocument()
    expect(screen.getByText('Nota del pedido:', { exact: false }).parentElement).toHaveTextContent('Nota del pedido: Mesa de cumpleaños')
    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Imprimir precuenta' })).toHaveAttribute('href', '/imprimir/12/cuenta')
    expect(screen.getByRole('link', { name: 'Imprimir comanda' })).toHaveAttribute('href', '/imprimir/12/comanda')
  })

  it('un delivery muestra la dirección, la referencia y el teléfono para llamar', async () => {
    open(
      handleOrder({
        type: 'delivery',
        table_id: null,
        table_label: null,
        customer_name: 'Rosa',
        customer_phone: '987654321',
        delivery_address: 'Jr. Ica 450',
        delivery_reference: 'Frente al parque',
      }),
    )

    expect(await screen.findByText('Delivery · Rosa')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Entrega' })).toHaveTextContent('Jr. Ica 450Ref.: Frente al parque')
    expect(screen.getByRole('link', { name: '987654321' })).toHaveAttribute('href', 'tel:987654321')
    expect(screen.queryByRole('button', { name: 'Cambiar de mesa' })).not.toBeInTheDocument()
  })

  it('un pedido pagado muestra cómo se cobró y el ticket, sin acciones', async () => {
    open(
      handleOrder({
        status: 'paid',
        payment_method_label: 'Efectivo',
        discount_amount: '5.00',
        discount_percent: '10.00',
        discount_reason: 'Cliente frecuente',
        tips: '3.00',
        amount_received: '50.00',
        change: '5.00',
        paid_at: '2026-09-26T18:00:00Z',
      }),
      PERMISSIONS_WAITER,
    )

    expect(await screen.findByText('Pagado con')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('S/ 5.00 · Cliente frecuente')).toBeInTheDocument()
    expect(screen.getByText('Vuelto').nextSibling).toHaveTextContent('S/ 5.00')
    expect(screen.getByRole('link', { name: 'Imprimir ticket' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Agregar platos' })).not.toBeInTheDocument()
  })

  it('un pedido cancelado dice por qué y no ofrece imprimir', async () => {
    open(handleOrder({ status: 'cancelled', cancel_reason: 'El cliente se fue', cancelled_at: '2026-09-26T18:00:00Z' }))

    expect(await screen.findByText(/Motivo: El cliente se fue/u)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Imprimir/u })).not.toBeInTheDocument()
  })

  it('si no se puede cargar, muestra el error y permite reintentar', async () => {
    const { api, user } = open(new ErrorResponse(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    api.on('get', ORDER, handleOrder())
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Pedido #34' })).toBeInTheDocument()
  })
})

describe('OrderDetailView: quién puede hacer qué', () => {
  it('el mesero cobra los pedidos que tomó, pero no cancela', async () => {
    open(handleOrder(), PERMISSIONS_WAITER)

    expect(await screen.findByRole('button', CHARGE)).toBeInTheDocument()
    expect(screen.queryByRole('button', CANCEL)).not.toBeInTheDocument()
  })

  it('el mesero no cobra el pedido de otro: lo espera quien lo atendió', async () => {
    open(handleOrder({ waiter_id: 8, waiter_name: 'Luis' }), PERMISSIONS_WAITER)

    expect(await screen.findByText('Servido, por cobrar: lo cobra quien lo atendió o el encargado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', CHARGE)).not.toBeInTheDocument()
  })

  it('el encargado cobra cualquier pedido y el botón abre la ventana de cobro', async () => {
    const { user } = open(handleOrder({ waiter_id: 8 }))

    await user.click(await screen.findByRole('button', CHARGE))

    expect(await screen.findByRole('dialog', { name: 'Cobrar pedido #34' })).toBeInTheDocument()
  })

  it('el mesero no marca listo: espera el aviso de la cocina', async () => {
    open(handleOrder({ status: 'in_kitchen' }), PERMISSIONS_WAITER)

    expect(await screen.findByText('En cocina: esta pantalla avisa sola cuando esté listo.')).toBeInTheDocument()
  })

  it('enviar a cocina avanza el pedido y lo avisa', async () => {
    const { api, user } = open(handleOrder({ status: 'open' }), PERMISSIONS_WAITER)
    api.on('post', '/orders/12/send', handleOrder({ status: 'in_kitchen' }))

    await user.click(await screen.findByRole('button', { name: 'Enviar a cocina' }))

    expect(await screen.findByText('Pedido #34 enviado a cocina.')).toBeInTheDocument()
    expect(api.calls('post', '/orders/12/send')).toHaveLength(1)
  })
})
