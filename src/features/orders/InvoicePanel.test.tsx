import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { invoice, paid, payment, buildOrder } from '#jest/fixtures/charge'
import { signInAs, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import type { OrderResponse } from '@/api/types'
import { InvoicePanel } from './InvoicePanel'

const ISSUE = '/billing/invoices'
const OF_ORDER = '/billing/orders/12/invoice'
const OPEN = { name: 'Emitir boleta o factura' }
const DIALOG = { name: 'Comprobante del pedido #34' }
const ISSUE_SALES_RECEIPT = { name: 'Emitir boleta' }

function paidBy(total: string): OrderResponse {
  return paid(buildOrder({ total, balance: total }), payment({ amount: total }))
}

// Como el servidor: emitido, el comprobante queda como el del pedido.
function onIssue(api: ReturnType<typeof server>, issued: ReturnType<typeof invoice>) {
  api.on('post', ISSUE, () => {
    api.on('get', OF_ORDER, issued)
    return issued
  })
}

function issueFor(order: OrderResponse = paidBy('50.00'), permissions = PERMISSIONS_OWNER) {
  const api = server()
  signInAs(permissions)
  return { api, ...mountScreen(<InvoicePanel order={order} />) }
}

describe('InvoicePanel', () => {
  it('una boleta chica puede ir a «clientes varios» sin pedir datos', async () => {
    const { api, user } = issueFor()
    onIssue(api, invoice())

    await user.click(await screen.findByRole('button', OPEN))
    const dialog = within(await screen.findByRole('dialog', DIALOG))
    expect(dialog.getByRole('button', { name: 'Boleta' })).toHaveAttribute('aria-pressed', 'true')
    expect(dialog.getByLabelText('Documento del cliente')).toHaveValue('none')
    await user.click(dialog.getByRole('button', ISSUE_SALES_RECEIPT))

    expect(await screen.findByText('Boleta B001-15')).toBeInTheDocument()
    expect(screen.getByText('Aceptada por SUNAT')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Imprimir' })).toHaveAttribute('href', '/comprobantes/90/imprimir')
    expect(api.calls('post', ISSUE)[0]?.body).toEqual({
      order_id: 12,
      kind: 'boleta',
      customer_document_type: 'none',
      customer_document_number: '',
      customer_name: '',
      customer_address: '',
    })
  })

  it('sobre S/ 700 la boleta exige el documento del cliente', async () => {
    const { user } = issueFor(paidBy('750.00'))

    await user.click(await screen.findByRole('button', OPEN))
    const dialog = within(await screen.findByRole('dialog', DIALOG))
    const document = dialog.getByLabelText('Documento del cliente')

    expect(document).toHaveValue('dni')
    expect(within(document).queryByRole('option', { name: 'Sin documento (clientes varios)' })).not.toBeInTheDocument()
    expect(dialog.getByRole('button', ISSUE_SALES_RECEIPT)).toBeDisabled()
    await user.type(dialog.getByLabelText('Número de documento'), '12345678')
    await user.type(dialog.getByLabelText('Nombre'), 'Luis Rojas')
    expect(dialog.getByRole('button', ISSUE_SALES_RECEIPT)).toBeEnabled()
  })

  it('la factura va con RUC, razón social y dirección fiscal', async () => {
    const { api, user } = issueFor()
    onIssue(api, invoice({ kind: 'factura', kind_label: 'Factura', code: 'F001-3' }))

    await user.click(await screen.findByRole('button', OPEN))
    const dialog = within(await screen.findByRole('dialog', DIALOG))
    await user.click(dialog.getByRole('button', { name: 'Factura' }))
    expect(dialog.getByText('Escribe el RUC y la razón social del cliente para emitir.')).toBeInTheDocument()
    await user.type(dialog.getByLabelText('RUC'), ' 20123456789 ')
    await user.type(dialog.getByLabelText('Razón social'), 'Inversiones Sol SAC')
    await user.type(dialog.getByLabelText('Dirección fiscal (opcional)'), 'Av. Arequipa 100')
    await user.click(dialog.getByRole('button', { name: 'Emitir factura' }))

    expect(await screen.findByText('Factura F001-3')).toBeInTheDocument()
    expect(api.calls('post', ISSUE)[0]?.body).toMatchObject({
      kind: 'factura',
      customer_document_type: 'ruc',
      customer_document_number: '20123456789',
      customer_name: 'Inversiones Sol SAC',
      customer_address: 'Av. Arequipa 100',
    })
  })

  it('si el servidor rechaza la emisión, lo dice dentro de la ventana', async () => {
    const { api, user } = issueFor()
    api.on('post', ISSUE, new ErrorResponse(422, 'La factura necesita el RUC del cliente.'))

    await user.click(await screen.findByRole('button', OPEN))
    await user.click(await screen.findByRole('button', ISSUE_SALES_RECEIPT))

    expect(await screen.findByText('La factura necesita el RUC del cliente.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', DIALOG)).toBeInTheDocument()
  })

  it('ya emitido muestra el estado y sus archivos; sin aceptar no hay PDF', async () => {
    const { api } = issueFor()
    api.on('get', OF_ORDER, invoice({ status: 'rejected', status_label: 'Rechazada', has_pdf: false, has_xml: true, has_cdr: true }))

    expect(await screen.findByText('Rechazada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar XML' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', OPEN)).not.toBeInTheDocument()
  })

  it('sin permiso para emitir, o con el pedido sin pagar, no aparece ni consulta', () => {
    const { api } = issueFor(paidBy('50.00'), PERMISSIONS_WAITER)
    mountScreen(<InvoicePanel order={buildOrder()} />)

    expect(screen.queryByRole('button', OPEN)).not.toBeInTheDocument()
    expect(api.calls('get', OF_ORDER)).toHaveLength(0)
  })
})
