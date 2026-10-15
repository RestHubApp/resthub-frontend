import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { taxSettings, invoice } from '#jest/fixtures/panel'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import type { BillingSettings, Invoice } from '@/api/types'
import { BillingView } from './BillingView'

const SETTINGS = '/billing/settings'
const ISSUED = '/billing/invoices'
const RUC = 'RUC del local'
const SAVE = { name: 'Guardar datos fiscales' }
const FISCAL = { name: /Datos fiscales/u }
const CERTIFICATE = '/billing/settings/certificate'
const SOL_USER = 'Usuario SOL'
const SOL_PASSWORD = 'Clave SOL'
const CERTIFICATE_FILE = 'Archivo del certificado'
const CERTIFICATE_PASSWORD = 'Contraseña del certificado'
const UPLOAD = { name: 'Subir certificado' }
const SAVED = 'Datos fiscales guardados.'

function open(settings: BillingSettings = taxSettings(), issued: Invoice[] = [], at = '/') {
  const api = server().on('get', SETTINGS, settings).on('get', ISSUED, { items: issued, total: issued.length })
  signInAs()
  return { api, ...mountScreen(<BillingView />, { en: at }) }
}

describe('BillingView: datos fiscales', () => {
  it('con todo listo los datos fiscales no ocupan la pantalla ni piden completarse', async () => {
    open()
    expect(await screen.findByRole('button', FISCAL)).toBeInTheDocument()
    expect(screen.queryByLabelText(RUC)).not.toBeInTheDocument()
    expect(screen.queryByText('Falta completar')).not.toBeInTheDocument()
  })

  it('si falta algo para enviar a SUNAT lo dice en el botón y la hoja dice qué falta', async () => {
    const { user } = open(taxSettings({ is_ready: false, has_sol_credentials: false, has_certificate: false, certificate_expires_at: null }))
    expect(await screen.findByText('Falta completar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', FISCAL))

    const sheet = within(await screen.findByRole('dialog', FISCAL))
    expect(sheet.getByText(/Falta el usuario y la clave SOL y el certificado digital\./u)).toBeInTheDocument()
    expect(sheet.getByLabelText(SOL_USER)).toBeInTheDocument()
    expect(sheet.getByText('Todavía no hay un certificado cargado.')).toBeInTheDocument()
  })

  it('con todo cargado dice que está listo y no muestra las credenciales SOL', async () => {
    const { user } = open()
    await user.click(await screen.findByRole('button', FISCAL))

    expect(await screen.findByText(/Listo para emitir/u)).toBeInTheDocument()
    expect(screen.getByText('Usuario y clave SOL cargados.')).toBeInTheDocument()
    expect(screen.queryByLabelText(SOL_USER)).not.toBeInTheDocument()
    expect(screen.getByText(/Certificado cargado\. Vence el/u)).toBeInTheDocument()
  })

  it('se abre sola desde la dirección con ?accion=datos-fiscales y la limpia', async () => {
    open(taxSettings(), [], '/?accion=datos-fiscales')

    expect(await screen.findByLabelText(RUC)).toBeInTheDocument()
  })

  it('guarda con la tasa en punto decimal, series en mayúsculas y sin mandar credenciales SOL que no se tocaron', async () => {
    const { api, user } = open(taxSettings({ is_ready: false }))
    api.on('put', SETTINGS, taxSettings())
    await user.click(await screen.findByRole('button', FISCAL))
    const igv = await screen.findByLabelText('IGV (%)')

    await user.clear(igv)
    await user.type(igv, '10,5')
    await user.clear(screen.getByLabelText('Serie de boletas'))
    await user.type(screen.getByLabelText('Serie de boletas'), 'b002')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText(SAVED)).toBeInTheDocument()
    expect(screen.queryByLabelText(RUC)).not.toBeInTheDocument()
    const body = api.calls('put', SETTINGS)[0]?.body
    expect(body).toMatchObject({ igv_rate: '10.5', boleta_series: 'B002', factura_series: 'F001' })
    expect(body).not.toHaveProperty('sol_user')
    expect(body).not.toHaveProperty('sol_password')
  })

  it('valida el RUC y las series antes de enviar', async () => {
    const { api, user } = open(taxSettings({ is_ready: false }))
    await user.click(await screen.findByRole('button', FISCAL))
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
})

async function openSheet(settings: BillingSettings) {
  const opened = open(settings)
  await opened.user.click(await screen.findByRole('button', FISCAL))
  await screen.findByLabelText(RUC)
  return opened
}

describe('BillingView: credenciales SOL', () => {
  it('«Reemplazar» muestra los campos vacíos y manda usuario y clave juntos, el usuario en mayúsculas', async () => {
    const { api, user } = await openSheet(taxSettings())
    api.on('put', SETTINGS, taxSettings())

    await user.click(screen.getByRole('button', { name: 'Reemplazar' }))
    expect(screen.getByLabelText(SOL_USER)).toHaveValue('')
    expect(screen.getByLabelText(SOL_PASSWORD)).toHaveAttribute('type', 'password')
    await user.type(screen.getByLabelText(SOL_USER), 'moddatos')
    await user.type(screen.getByLabelText(SOL_PASSWORD), 'Clave Sol 1')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText(SAVED)).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)[0]?.body).toMatchObject({ sol_user: 'MODDATOS', sol_password: 'Clave Sol 1' })
  })

  it('«Conservar las cargadas» vuelve al indicador sin mandar nada de SOL', async () => {
    const { api, user } = await openSheet(taxSettings())
    api.on('put', SETTINGS, taxSettings())

    await user.click(screen.getByRole('button', { name: 'Reemplazar' }))
    await user.type(screen.getByLabelText(SOL_USER), 'OTRO')
    await user.click(screen.getByRole('button', { name: 'Conservar las cargadas' }))
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText(SAVED)).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)[0]?.body).not.toHaveProperty('sol_user')
  })

  it('pide el usuario y la clave juntos y con el formato de SUNAT', async () => {
    const { api, user } = await openSheet(taxSettings({ has_sol_credentials: false, is_ready: false }))

    await user.type(screen.getByLabelText(SOL_USER), 'MOD DATOS')
    await user.click(screen.getByRole('button', SAVE))
    expect(await screen.findByText('De 3 a 20 letras o números, sin el RUC delante')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(SOL_USER))
    await user.type(screen.getByLabelText(SOL_USER), 'MODDATOS')
    await user.click(screen.getByRole('button', SAVE))
    expect(await screen.findByText('Escribe también la clave SOL')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)).toHaveLength(0)
  })

  it('con otro RUC pide volver a escribir las credenciales', async () => {
    const { api, user } = await openSheet(taxSettings())
    const ruc = screen.getByLabelText(RUC)

    await user.clear(ruc)
    await user.type(ruc, '20999999999')
    expect(screen.queryByRole('button', { name: 'Conservar las cargadas' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Con otro RUC, vuelve a escribir el usuario y la clave SOL')).toBeInTheDocument()
    expect(api.calls('put', SETTINGS)).toHaveLength(0)
  })

  it('si el servicio de facturación no responde (502) lo dice en palabras simples', async () => {
    const { api, user } = await openSheet(taxSettings({ has_sol_credentials: false, is_ready: false }))
    api.on('put', SETTINGS, new ErrorResponse(502, 'No se pudo conectar con el servicio de facturación.', 'billing_provider'))

    await user.type(screen.getByLabelText(SOL_USER), 'MODDATOS')
    await user.type(screen.getByLabelText(SOL_PASSWORD), 'moddatos')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('El servicio de facturación no está disponible, intenta en unos minutos.')).toBeInTheDocument()
  })

  it('un error del servidor al guardar se muestra en el formulario', async () => {
    const { api, user } = await openSheet(taxSettings())
    api.on('put', SETTINGS, new ErrorResponse(422, 'La serie ya está en uso', 'invalid_billing_settings'))

    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('La serie ya está en uso')).toBeInTheDocument()
  })
})

const WITHOUT_CERTIFICATE = { has_certificate: false, certificate_expires_at: null, is_ready: false }

function certificate(name: string, bytes = 1200): File {
  return new File([new Uint8Array(bytes).fill(65)], name, { type: 'application/x-pkcs12' })
}

describe('BillingView: certificado digital', () => {
  it('lee el archivo en el navegador y lo sube en base64 con su contraseña', async () => {
    const { api, user } = await openSheet(taxSettings(WITHOUT_CERTIFICATE))
    const uploaded = taxSettings({ certificate_expires_at: '2027-09-30T17:00:00Z' })
    api.on('put', CERTIFICATE, uploaded).on('get', SETTINGS, uploaded)

    await user.upload(screen.getByLabelText(CERTIFICATE_FILE), new File(['hola'], 'firma.PFX'))
    await user.type(screen.getByLabelText(CERTIFICATE_PASSWORD), 'secreta')
    await user.click(screen.getByRole('button', UPLOAD))

    expect(await screen.findByText('Certificado digital cargado.')).toBeInTheDocument()
    expect(api.calls('put', CERTIFICATE)[0]?.body).toEqual({ content_base64: 'aG9sYQ==', password: 'secreta' })
    expect(await screen.findByText(/Certificado cargado\. Vence el .*2027/u)).toBeInTheDocument()
  })

  it('no sube un archivo de más de 64 KB', async () => {
    const { api, user } = await openSheet(taxSettings(WITHOUT_CERTIFICATE))

    await user.upload(screen.getByLabelText(CERTIFICATE_FILE), certificate('grande.p12', 64 * 1024 + 1))
    await user.click(screen.getByRole('button', UPLOAD))

    expect(await screen.findByText('El archivo pesa más de 64 KB: no parece un certificado digital.')).toBeInTheDocument()
    expect(api.calls('put', CERTIFICATE)).toHaveLength(0)
  })

  it('no sube un archivo que no sea .pfx, .p12 o .pem', async () => {
    const { api, user } = await openSheet(taxSettings(WITHOUT_CERTIFICATE))
    // Quien elige «Todos los archivos» en el diálogo puede saltarse el filtro de `accept`.
    const anyFile = userEvent.setup({ applyAccept: false })

    await anyFile.upload(screen.getByLabelText(CERTIFICATE_FILE), certificate('firma.crt'))
    await user.click(screen.getByRole('button', UPLOAD))

    expect(await screen.findByText('El certificado tiene que ser un archivo .pfx, .p12 o .pem.')).toBeInTheDocument()
    expect(api.calls('put', CERTIFICATE)).toHaveLength(0)
  })

  it('si el servidor rechaza el certificado (422) dice por qué', async () => {
    const { api, user } = await openSheet(taxSettings(WITHOUT_CERTIFICATE))
    api.on('put', CERTIFICATE, new ErrorResponse(422, 'La contraseña del certificado no es correcta.', 'invalid_certificate'))

    await user.upload(screen.getByLabelText(CERTIFICATE_FILE), certificate('firma.p12'))
    await user.click(screen.getByRole('button', UPLOAD))

    expect(await screen.findByText('La contraseña del certificado no es correcta.')).toBeInTheDocument()
  })

  it('avisa si el certificado vence en menos de 30 días', async () => {
    const soon = new Date(Date.now() + 10 * 86_400_000).toISOString()
    await openSheet(taxSettings({ certificate_expires_at: soon }))

    expect(screen.getByText(/El certificado vence el .*Renuévalo antes/u)).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevo certificado')).toBeInTheDocument()
  })

  it('un certificado vencido cuenta como faltante para emitir', async () => {
    await openSheet(taxSettings({ certificate_expires_at: '2020-01-01T17:00:00Z' }))

    expect(screen.getByText(/El certificado venció el/u)).toBeInTheDocument()
    expect(screen.getByText(/Falta un certificado digital vigente\./u)).toBeInTheDocument()
  })
})

describe('BillingView: emitidos', () => {
  it('sin comprobantes lo dice', async () => {
    open()
    expect(await screen.findByText('Todavía no se emitió ningún comprobante')).toBeInTheDocument()
  })

  it('un comprobante aceptado se imprime pero no se reenvía', async () => {
    open(taxSettings(), [invoice()])
    await screen.findByText(/B001-12 · S\/ 60.00/u)
    const row = screen.getAllByRole('listitem').find((item) => within(item).queryByText(/B001-12 · S\/ 60.00/u) !== null)
    if (row === undefined) {
      throw new Error('No se encontró la fila del comprobante')
    }
    const inRow = within(row)
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
    api.on('post', '/billing/invoices/7/resend', new ErrorResponse(502, 'Sin conexión', 'billing_provider'))

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('El servicio de facturación no está disponible, intenta en unos minutos.')).toBeInTheDocument()
  })

  it('pagina de a 25 comprobantes', async () => {
    const api = server()
      .on('get', SETTINGS, taxSettings())
      .on('get', ISSUED, { items: [invoice()], total: 30 })
    signInAs()
    const { user } = mountScreen(<BillingView />)

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(api.calls('get', ISSUED).at(-1)?.params).toEqual({ limit: '25', offset: '25' })
  })

  it('si la lista falla muestra el error', async () => {
    server().on('get', SETTINGS, taxSettings()).on('get', ISSUED, new ErrorResponse(500, 'Sin base'))
    signInAs()
    mountScreen(<BillingView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})
