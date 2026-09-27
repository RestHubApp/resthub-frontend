import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ajustesFiscales, comprobante } from '#jest/fixtures/panel'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { BillingSettings, Invoice } from '../../api/types'
import BillingView from './BillingView'

const AJUSTES = '/billing/settings'
const EMITIDOS = '/billing/invoices'
const RUC = 'RUC del local'
const GUARDAR = { name: 'Guardar datos fiscales' }

function abrir(ajustes: BillingSettings = ajustesFiscales(), emitidos: Invoice[] = []) {
  const api = servidor().on('get', AJUSTES, ajustes).on('get', EMITIDOS, { items: emitidos, total: emitidos.length })
  entrarComo()
  return { api, ...montar(<BillingView />) }
}

describe('BillingView: datos fiscales', () => {
  it('con todo listo, los datos fiscales empiezan cerrados', async () => {
    abrir()
    const titulo = await screen.findByRole('button', { name: /Datos fiscales/u })
    expect(titulo).toHaveAttribute('aria-expanded', 'false')
  })

  it('si falta algo para enviar a SUNAT se abren solos y dicen que falta el token', async () => {
    abrir(ajustesFiscales({ is_ready: false, has_provider_token: false }))
    expect(await screen.findByRole('button', { name: /Datos fiscales/u })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Todavía no cargado.')).toBeInTheDocument()
  })

  it('guarda con la tasa en punto decimal, series en mayúsculas y sin tocar el token vacío', async () => {
    const { api, user } = abrir(ajustesFiscales({ is_ready: false }))
    api.on('put', AJUSTES, ajustesFiscales())
    const igv = await screen.findByLabelText('IGV (%)')

    await user.clear(igv)
    await user.type(igv, '10,5')
    await user.clear(screen.getByLabelText('Serie de boletas'))
    await user.type(screen.getByLabelText('Serie de boletas'), 'b002')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('Datos fiscales guardados.')).toBeInTheDocument()
    expect(api.llamadas('put', AJUSTES)[0]?.body).toMatchObject({
      igv_rate: '10.5',
      boleta_series: 'B002',
      factura_series: 'F001',
      provider_token: null,
    })
  })

  it('valida el RUC y las series antes de enviar', async () => {
    const { api, user } = abrir(ajustesFiscales({ is_ready: false }))
    const ruc = await screen.findByLabelText(RUC)

    await user.clear(ruc)
    await user.type(ruc, '3012345678')
    await user.clear(screen.getByLabelText('Serie de facturas'))
    await user.type(screen.getByLabelText('Serie de facturas'), 'B001')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('El RUC tiene 11 dígitos y empieza en 10 o 20')).toBeInTheDocument()
    expect(screen.getByText('Cuatro caracteres, empieza con F')).toBeInTheDocument()
    expect(api.llamadas('put', AJUSTES)).toHaveLength(0)
  })

  it('un error del servidor al guardar se muestra en el formulario', async () => {
    const { api, user } = abrir(ajustesFiscales({ is_ready: false }))
    api.on('put', AJUSTES, new RespuestaDeError(422, 'El proveedor rechazó el token'))

    await user.type(await screen.findByLabelText('Token del proveedor'), 'secreto')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('El proveedor rechazó el token')).toBeInTheDocument()
    expect(api.llamadas('put', AJUSTES)[0]?.body).toMatchObject({ provider_token: 'secreto' })
  })
})

describe('BillingView: emitidos', () => {
  it('sin comprobantes lo dice', async () => {
    abrir()
    expect(await screen.findByText('Todavía no se emitió ningún comprobante')).toBeInTheDocument()
  })

  it('un comprobante aceptado se imprime pero no se reenvía', async () => {
    abrir(ajustesFiscales(), [comprobante()])
    const fila = (await screen.findByText(/B001-12 · S\/ 60.00/u)).closest('li')
    expect(fila).not.toBeNull()
    const enFila = within(fila as HTMLElement)
    expect(enFila.getByRole('link', { name: 'Imprimir' })).toHaveAttribute('href', '/comprobantes/5/imprimir')
    expect(enFila.queryByRole('button', { name: 'Reenviar' })).not.toBeInTheDocument()
  })

  it('reenvía un comprobante rechazado y avisa cómo quedó', async () => {
    const rechazado = comprobante({ id: 6, code: 'F001-3', status: 'rejected', status_label: 'Rechazado' })
    const { api, user } = abrir(ajustesFiscales(), [rechazado])
    api.on('post', '/billing/invoices/6/resend', { ...rechazado, status: 'accepted', status_label: 'Aceptado por SUNAT' })

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('F001-3: Aceptado por SUNAT.')).toBeInTheDocument()
  })

  it('si el reenvío falla lo avisa', async () => {
    const pendiente = comprobante({ id: 7, status: 'pending', status_label: 'Sin enviar' })
    const { api, user } = abrir(ajustesFiscales(), [pendiente])
    api.on('post', '/billing/invoices/7/resend', new RespuestaDeError(502, 'El proveedor no responde'))

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('El proveedor no responde')).toBeInTheDocument()
  })

  it('pagina de a 25 comprobantes', async () => {
    const api = servidor()
      .on('get', AJUSTES, ajustesFiscales())
      .on('get', EMITIDOS, { items: [comprobante()], total: 30 })
    entrarComo()
    const { user } = montar(<BillingView />)

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(api.llamadas('get', EMITIDOS).at(-1)?.params).toEqual({ limit: 25, offset: 25 })
  })

  it('si la lista falla muestra el error', async () => {
    servidor().on('get', AJUSTES, ajustesFiscales()).on('get', EMITIDOS, new RespuestaDeError(500, 'Sin base'))
    entrarComo()
    montar(<BillingView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})
