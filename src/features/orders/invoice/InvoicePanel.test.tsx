import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { comprobante, pagado, pago, pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { OrderResponse } from '../../../api/types'
import InvoicePanel from './InvoicePanel'

const EMITIR = '/billing/invoices'
const DEL_PEDIDO = '/billing/orders/12/invoice'
const ABRIR = { name: 'Emitir boleta o factura' }
const DIALOGO = { name: 'Comprobante del pedido #34' }
const EMITIR_BOLETA = { name: 'Emitir boleta' }

function pagadoPor(total: string): OrderResponse {
  return pagado(pedido({ total, balance: total }), pago({ amount: total }))
}

// Como el servidor: emitido, el comprobante queda como el del pedido.
function alEmitir(api: ReturnType<typeof servidor>, emitido: ReturnType<typeof comprobante>) {
  api.on('post', EMITIR, () => {
    api.on('get', DEL_PEDIDO, emitido)
    return emitido
  })
}

function emitirPara(order: OrderResponse = pagadoPor('50.00'), permisos = PERMISOS_ENCARGADO) {
  const api = servidor()
  entrarComo(permisos)
  return { api, ...montar(<InvoicePanel order={order} />) }
}

describe('InvoicePanel', () => {
  it('una boleta chica puede ir a «clientes varios» sin pedir datos', async () => {
    const { api, user } = emitirPara()
    alEmitir(api, comprobante())

    await user.click(await screen.findByRole('button', ABRIR))
    const dialogo = within(await screen.findByRole('dialog', DIALOGO))
    expect(dialogo.getByRole('button', { name: 'Boleta' })).toHaveAttribute('aria-pressed', 'true')
    expect(dialogo.getByLabelText('Documento del cliente')).toHaveValue('none')
    await user.click(dialogo.getByRole('button', EMITIR_BOLETA))

    expect(await screen.findByText('Boleta B001-15')).toBeInTheDocument()
    expect(screen.getByText('Aceptada por SUNAT')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Imprimir' })).toHaveAttribute('href', '/comprobantes/90/imprimir')
    expect(api.llamadas('post', EMITIR)[0]?.body).toEqual({
      order_id: 12,
      kind: 'boleta',
      customer_document_type: 'none',
      customer_document_number: '',
      customer_name: '',
      customer_address: '',
    })
  })

  it('sobre S/ 700 la boleta exige el documento del cliente', async () => {
    const { user } = emitirPara(pagadoPor('750.00'))

    await user.click(await screen.findByRole('button', ABRIR))
    const dialogo = within(await screen.findByRole('dialog', DIALOGO))
    const documento = dialogo.getByLabelText('Documento del cliente')

    expect(documento).toHaveValue('dni')
    expect(within(documento).queryByRole('option', { name: 'Sin documento (clientes varios)' })).not.toBeInTheDocument()
    expect(dialogo.getByRole('button', EMITIR_BOLETA)).toBeDisabled()
    await user.type(dialogo.getByLabelText('Número de documento'), '12345678')
    await user.type(dialogo.getByLabelText('Nombre'), 'Luis Rojas')
    expect(dialogo.getByRole('button', EMITIR_BOLETA)).toBeEnabled()
  })

  it('la factura va con RUC, razón social y dirección fiscal', async () => {
    const { api, user } = emitirPara()
    alEmitir(api, comprobante({ kind: 'factura', kind_label: 'Factura', code: 'F001-3' }))

    await user.click(await screen.findByRole('button', ABRIR))
    const dialogo = within(await screen.findByRole('dialog', DIALOGO))
    await user.click(dialogo.getByRole('button', { name: 'Factura' }))
    expect(dialogo.getByText('Escribe el RUC y la razón social del cliente para emitir.')).toBeInTheDocument()
    await user.type(dialogo.getByLabelText('RUC'), ' 20123456789 ')
    await user.type(dialogo.getByLabelText('Razón social'), 'Inversiones Sol SAC')
    await user.type(dialogo.getByLabelText('Dirección fiscal (opcional)'), 'Av. Arequipa 100')
    await user.click(dialogo.getByRole('button', { name: 'Emitir factura' }))

    expect(await screen.findByText('Factura F001-3')).toBeInTheDocument()
    expect(api.llamadas('post', EMITIR)[0]?.body).toMatchObject({
      kind: 'factura',
      customer_document_type: 'ruc',
      customer_document_number: '20123456789',
      customer_name: 'Inversiones Sol SAC',
      customer_address: 'Av. Arequipa 100',
    })
  })

  it('si el proveedor rechaza la emisión, lo dice dentro de la ventana', async () => {
    const { api, user } = emitirPara()
    api.on('post', EMITIR, new RespuestaDeError(502, 'El proveedor no respondió.'))

    await user.click(await screen.findByRole('button', ABRIR))
    await user.click(await screen.findByRole('button', EMITIR_BOLETA))

    expect(await screen.findByText('El proveedor no respondió.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', DIALOGO)).toBeInTheDocument()
  })

  it('ya emitido muestra el estado y el PDF del proveedor', async () => {
    const { api } = emitirPara()
    api.on('get', DEL_PEDIDO, comprobante({ status: 'rejected', status_label: 'Rechazada', pdf_url: 'https://pse.pe/b.pdf' }))

    expect(await screen.findByText('Rechazada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PDF' })).toHaveAttribute('href', 'https://pse.pe/b.pdf')
    expect(screen.queryByRole('button', ABRIR)).not.toBeInTheDocument()
  })

  it('sin permiso para emitir, o con el pedido sin pagar, no aparece ni consulta', () => {
    const { api } = emitirPara(pagadoPor('50.00'), PERMISOS_MESERO)
    montar(<InvoicePanel order={pedido()} />)

    expect(screen.queryByRole('button', ABRIR)).not.toBeInTheDocument()
    expect(api.llamadas('get', DEL_PEDIDO)).toHaveLength(0)
  })
})
