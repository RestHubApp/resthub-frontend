import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { taxSettings } from '#jest/fixtures/panel'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import type { BillingSettings } from '@/api/types'
import { BillingView } from './BillingView'

// El certificado digital se sube desde la hoja «Datos fiscales» de Comprobantes.
const SETTINGS = '/billing/settings'
const CERTIFICATE = '/billing/settings/certificate'
const CERTIFICATE_FILE = 'Archivo del certificado'
const CERTIFICATE_PASSWORD = 'Contraseña del certificado'
const UPLOAD = { name: 'Subir certificado' }
const CREDENTIALS_REJECTED = 'SUNAT no aceptó el usuario SOL, la clave o el certificado. Revísalos y vuelve a guardar.'

async function openSheet(settings: BillingSettings) {
  const api = server().on('get', SETTINGS, settings).on('get', '/billing/invoices', { items: [], total: 0 })
  signInAs()
  const mounted = mountScreen(<BillingView />)
  await mounted.user.click(await screen.findByRole('button', { name: /Datos fiscales/u }))
  await screen.findByLabelText('RUC del local')
  return { api, ...mounted }
}

const WITHOUT_CERTIFICATE = { has_certificate: false, certificate_expires_at: null, is_ready: false }

function certificate(name: string, bytes = 1200): File {
  return new File([new Uint8Array(bytes).fill(65)], name, { type: 'application/x-pkcs12' })
}

describe('CertificateForm: certificado digital', () => {
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

  it('con el certificado vencido confía en is_ready del servidor y avisa el vencimiento', async () => {
    await openSheet(taxSettings({ certificate_expires_at: '2020-01-01T17:00:00Z', is_ready: false }))

    expect(screen.getByText(/El certificado venció el/u)).toBeInTheDocument()
    expect(screen.getByText(/Todavía no se puede emitir\. Revisa el vencimiento del certificado\./u)).toBeInTheDocument()
  })

  it('si SUNAT rechaza el certificado al registrarlo (422 invalid_billing_credentials) pide revisar las credenciales', async () => {
    const { api, user } = await openSheet(taxSettings(WITHOUT_CERTIFICATE))
    api.on('put', CERTIFICATE, new ErrorResponse(422, 'Rechazado por el servicio.', 'invalid_billing_credentials'))

    await user.upload(screen.getByLabelText(CERTIFICATE_FILE), certificate('firma.p12'))
    await user.click(screen.getByRole('button', UPLOAD))

    expect(await screen.findByText(CREDENTIALS_REJECTED)).toBeInTheDocument()
  })
})
