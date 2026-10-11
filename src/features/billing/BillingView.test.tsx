import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { taxSettings, invoice } from '#jest/fixtures/panel'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import type { BillingSettings, Invoice } from '@/api/types'
import { BillingView } from './BillingView'

const SETTINGS = '/billing/settings'
const ISSUED = '/billing/invoices'
const RUC = 'RUC del local'
const SAVE = { name: 'Guardar datos fiscales' }

function open(settings: BillingSettings = taxSettings(), issued: Invoice[] = []) {
  const api = server().on('get', SETTINGS, settings).on('get', ISSUED, { items: issued, total: issued.length })
  signInAs()
  return { api, ...mountScreen(<BillingView />) }
}

describe('BillingView: datos fiscales', () => {
  it('con todo listo, los datos fiscales empiezan cerrados', async () => {
    open()
    const title = await screen.findByRole('button', { name: /Datos fiscales/u })
    expect(title).toHaveAttribute('aria-expanded', 'false')
  })

  it('si falta algo para enviar a SUNAT se abren solos y dicen que falta el token', async () => {
    open(taxSettings({ is_ready: false, has_provider_token: false }))
    expect(await screen.findByRole('button', { name: /Datos fiscales/u })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Todavía no cargado.')).toBeInTheDocument()
  })

  it('guarda con la tasa en punto decimal, series en mayúsculas y sin tocar el token vacío', async () => {
    const { api, user } = open(taxSettings({ is_ready: false }))
    api.on('put', SETTINGS, taxSettings())
    const igv = await screen.findByLabelText('IGV (%)')

    await user.clear(igv)
    await user.type(igv, '10,5')
    await user.clear(screen.getByLabelText('Serie de boletas'))
    await user.type(screen.getByLabelText('Serie de boletas'), 'b002')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Datos fiscales guardados.')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)[0]?.body).toMatchObject({
      igv_rate: '10.5',
      boleta_series: 'B002',
      factura_series: 'F001',
      provider_token: null,
    })
  })

  it('valida el RUC y las series antes de enviar', async () => {
    const { api, user } = open(taxSettings({ is_ready: false }))
    const ruc = await screen.findByLabelText(RUC)

    await user.clear(ruc)
    await user.type(ruc, '3012345678')
    await user.clear(screen.getByLabelText('Serie de facturas'))
    await user.type(screen.getByLabelText('Serie de facturas'), 'B001')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('El RUC tiene 11 dígitos y empieza en 10 o 20')).toBeInTheDocument()
    expect(screen.getByText('Cuatro caracteres, empieza con F')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)).toHaveLength(0)
  })

  it('un error del servidor al guardar se muestra en el formulario', async () => {
    const { api, user } = open(taxSettings({ is_ready: false }))
    api.on('put', SETTINGS, new ErrorResponse(422, 'El proveedor rechazó el token'))

    await user.type(await screen.findByLabelText('Token del proveedor'), 'secreto')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('El proveedor rechazó el token')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)[0]?.body).toMatchObject({ provider_token: 'secreto' })
  })
})

describe('BillingView: emitidos', () => {
  it('sin comprobantes lo dice', async () => {
    open()
    expect(await screen.findByText('Todavía no se emitió ningún comprobante')).toBeInTheDocument()
  })

  it('un comprobante aceptado se imprime pero no se reenvía', async () => {
    open(taxSettings(), [invoice()])
    const row = (await screen.findByText(/B001-12 · S\/ 60.00/u)).closest('li')
    expect(row).not.toBeNull()
    const inRow = within(row as HTMLElement)
    expect(inRow.getByRole('link', { name: 'Imprimir' })).toHaveAttribute('href', '/comprobantes/5/imprimir')
    expect(inRow.queryByRole('button', { name: 'Reenviar' })).not.toBeInTheDocument()
  })

  it('reenvía un comprobante rechazado y avisa cómo quedó', async () => {
    const rejected = invoice({ id: 6, code: 'F001-3', status: 'rejected', status_label: 'Rechazado' })
    const { api, user } = open(taxSettings(), [rejected])
    api.on('post', '/billing/invoices/6/resend', { ...rejected, status: 'accepted', status_label: 'Aceptado por SUNAT' })

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('F001-3: Aceptado por SUNAT.')).toBeInTheDocument()
  })

  it('si el reenvío falla lo avisa', async () => {
    const pending = invoice({ id: 7, status: 'pending', status_label: 'Sin enviar' })
    const { api, user } = open(taxSettings(), [pending])
    api.on('post', '/billing/invoices/7/resend', new ErrorResponse(502, 'El proveedor no responde'))

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('El proveedor no responde')).toBeInTheDocument()
  })

  it('pagina de a 25 comprobantes', async () => {
    const api = server()
      .on('get', SETTINGS, taxSettings())
      .on('get', ISSUED, { items: [invoice()], total: 30 })
    signInAs()
    const { user } = mountScreen(<BillingView />)

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(api.calls('get', ISSUED).at(-1)?.params).toEqual({ limit: 25, offset: 25 })
  })

  it('si la lista falla muestra el error', async () => {
    server().on('get', SETTINGS, taxSettings()).on('get', ISSUED, new ErrorResponse(500, 'Sin base'))
    signInAs()
    mountScreen(<BillingView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})
