import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { ajustesFiscales, comprobante } from '#jest/fixtures/panel'
import { entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { Invoice } from '../../api/types'
import InvoicePrintView from './InvoicePrintView'

const RUTA = '/comprobantes/:invoiceId/imprimir'

function imprimir(factura: Invoice | RespuestaDeError, permisos?: Parameters<typeof entrarComo>[0]) {
  const imprimirSpy = jest.spyOn(window, 'print')
  const api = servidor().on('get', '/billing/invoices/5', factura).on('get', '/billing/settings', ajustesFiscales())
  entrarComo(permisos)
  const { user } = montar(<InvoicePrintView />, { path: RUTA, en: '/comprobantes/5/imprimir' })
  return { api, imprimirSpy, user }
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('InvoicePrintView', () => {
  it('el encargado ve el emisor con su RUC y la hoja se imprime sola', async () => {
    const { imprimirSpy } = imprimir(comprobante())
    expect(await screen.findByText('RUC 20123456789')).toBeInTheDocument()
    expect(screen.getByText('La Picantería S.A.C.')).toBeInTheDocument()
    expect(screen.getByText('B001-12')).toBeInTheDocument()
    expect(screen.getByText('2 × Ceviche')).toBeInTheDocument()
    expect(screen.getByText('Representación impresa del comprobante electrónico aceptado por SUNAT.')).toBeInTheDocument()
    expect(imprimirSpy).toHaveBeenCalledTimes(1)
  })

  it('el mesero imprime sin el encabezado fiscal y sin pedir los ajustes', async () => {
    const { api } = imprimir(comprobante(), [...PERMISOS_MESERO, 'billing.issue'])
    expect(await screen.findByText('B001-12')).toBeInTheDocument()
    expect(screen.queryByText('RUC 20123456789')).not.toBeInTheDocument()
    expect(api.llamadas('get', '/billing/settings')).toHaveLength(0)
  })

  it('una factura muestra el documento del cliente, el descuento y el IGV', async () => {
    imprimir(
      comprobante({
        kind: 'factura',
        kind_label: 'Factura',
        code: 'F001-3',
        customer_name: 'Comercial Andina S.A.',
        customer_document_type: 'ruc',
        customer_document_number: '20555555551',
        discount: '6.00',
        status: 'pending',
        status_label: 'Sin enviar',
      }),
    )
    expect(await screen.findByText('Factura electrónica')).toBeInTheDocument()
    expect(screen.getByText(/Comercial Andina S.A. · RUC 20555555551/u)).toBeInTheDocument()
    expect(screen.getByText('− S/ 6.00')).toBeInTheDocument()
    expect(screen.getByText('IGV 18.0 %')).toBeInTheDocument()
    expect(screen.getByText('Estado: Sin enviar.')).toBeInTheDocument()
  })

  it('el botón vuelve a imprimir', async () => {
    const { imprimirSpy, user } = imprimir(comprobante())
    await screen.findByText('B001-12')
    await user.click(screen.getByRole('button', { name: 'Imprimir' }))
    expect(imprimirSpy).toHaveBeenCalledTimes(2)
  })

  it('si el comprobante no existe lo dice y no imprime', async () => {
    const { imprimirSpy } = imprimir(new RespuestaDeError(404, 'Ese comprobante no existe'))
    expect(await screen.findByText('Ese comprobante no existe')).toBeInTheDocument()
    expect(imprimirSpy).not.toHaveBeenCalled()
  })
})
