import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { invoice } from '#jest/fixtures/charge'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { BillingCapabilities } from '@/api/types'
import { IssuedInvoice } from '@/features/orders/invoice/IssuedInvoice'
import { formatMoney } from '@/services/format'

const CAPABILITIES = '/billing/capabilities'
const EMAIL = '/billing/invoices/90/email'
const PDF_FILE = '/billing/invoices/90/pdf'
const SEND_EMAIL = { name: 'Enviar por correo' }
const SEND = { name: 'Enviar' }
const RECIPIENT = 'Correo de quien lo recibe'
const RECEIVER = 'rosa@correo.pe'
const EMAIL_DIALOG = SEND_EMAIL
const DOWNLOAD_PDF = { name: 'Descargar PDF' }

function open(capabilities: Partial<BillingCapabilities>, changes = {}, permissions = PERMISSIONS_OWNER) {
  const api = server().on('get', CAPABILITIES, { email_enabled: false, email_max_per_hour: 20, archive_enabled: false, ...capabilities })
  signInAs(permissions)
  return { api, ...mountScreen(<IssuedInvoice invoice={invoice(changes)} />) }
}

function fileResponse(content: string, type: string): Response {
  return new Response(content, { headers: { 'Content-Type': type } })
}

const PDF_CONTENT = '%PDF-1.4'

function pdfResponse(): Response {
  return fileResponse(PDF_CONTENT, 'application/pdf')
}

/** Atrapa la descarga: el archivo de la URL de objeto, el nombre con que se guarda y si se revocó. */
function catchDownload() {
  const created: Blob[] = []
  const names: string[] = []
  const revoke = jest.fn()
  Object.assign(URL, {
    createObjectURL: (file: Blob) => {
      created.push(file)
      return 'blob:comprobante'
    },
    revokeObjectURL: revoke,
  })
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
    names.push(this.download)
  })
  return { created, names, revoke }
}

describe('IssuedInvoice: descargar', () => {
  it('ofrece solo los archivos que existen y ningún enlace externo', async () => {
    open({}, { has_pdf: false, has_xml: true, has_cdr: false })

    expect(await screen.findByRole('button', { name: 'Descargar XML' })).toBeInTheDocument()
    expect(screen.queryByRole('button', DOWNLOAD_PDF)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Descargar CDR' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /PDF|XML|CDR|WhatsApp/u })).not.toBeInTheDocument()
  })

  it('baja el PDF con la sesión y lo guarda con la serie y el número', async () => {
    const { api, user } = open({})
    api.on('get', PDF_FILE, pdfResponse())
    const download = catchDownload()

    await user.click(await screen.findByRole('button', DOWNLOAD_PDF))

    await waitFor(() => {
      expect(download.revoke).toHaveBeenCalledWith('blob:comprobante')
    })
    expect(download.names).toEqual(['B001-15.pdf'])
    expect(await download.created[0]?.text()).toBe(PDF_CONTENT)
    expect(api.calls('get', PDF_FILE)[0]?.headers['authorization']).toMatch(/^Bearer /u)
  })

  it('el CDR sale como zip con la serie y el número', async () => {
    const { api, user } = open({})
    api.on('get', '/billing/invoices/90/cdr', fileResponse('PK', 'application/zip'))
    const download = catchDownload()

    await user.click(await screen.findByRole('button', { name: 'Descargar CDR' }))

    await waitFor(() => {
      expect(download.names).toEqual(['B001-15-cdr.zip'])
    })
  })

  it('si el archivo todavía no está disponible (409) lo dice en español', async () => {
    const { api, user } = open({})
    api.on('get', PDF_FILE, new ErrorResponse(409, 'El comprobante B001-15 todavía no tiene PDF.', 'invoice_document_unavailable'))

    await user.click(await screen.findByRole('button', DOWNLOAD_PDF))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese archivo del comprobante todavía no está disponible.')
  })

  it('si el servicio de facturación no responde (502) pide intentar en unos minutos', async () => {
    const { api, user } = open({})
    api.on('get', PDF_FILE, new ErrorResponse(502, 'No se pudo conectar.', 'billing_provider'))

    await user.click(await screen.findByRole('button', DOWNLOAD_PDF))

    expect(await screen.findByText('El servicio de facturación no está disponible, intenta en unos minutos.')).toBeInTheDocument()
  })
})

const SHARE = { name: 'Compartir comprobante' }

/** Un navegador que comparte archivos (o no): `share` responde lo que diga la prueba. */
function shareSupport(canShare: boolean, share: (data: ShareData) => Promise<void> = () => Promise.resolve()) {
  const shared = jest.fn(share)
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => canShare })
  Object.defineProperty(navigator, 'share', { configurable: true, value: shared })
  return shared
}

describe('IssuedInvoice: compartir el PDF', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'canShare')
    Reflect.deleteProperty(navigator, 'share')
  })

  it('comparte el PDF como archivo con el local, la serie-número y el total', async () => {
    const share = shareSupport(true)
    const { api, user } = open({})
    api.on('get', PDF_FILE, pdfResponse())

    await user.click(await screen.findByRole('button', SHARE))

    await waitFor(() => {
      expect(share).toHaveBeenCalledTimes(1)
    })
    const data = share.mock.calls[0]?.[0]
    const file = data?.files?.[0]
    expect(file?.name).toBe('B001-15.pdf')
    expect(file?.type).toBe('application/pdf')
    expect(file?.size).toBe(PDF_CONTENT.length)
    expect(data?.title).toBe('Boleta B001-15')
    expect(data?.text).toBe(`La Picantería · Boleta B001-15 · Total ${formatMoney('50.00')}`)
  })

  it('en un navegador que no comparte archivos no aparece: queda «Descargar PDF»', async () => {
    shareSupport(false)
    open({})

    expect(await screen.findByRole('button', DOWNLOAD_PDF)).toBeInTheDocument()
    expect(screen.queryByRole('button', SHARE)).not.toBeInTheDocument()
  })

  it('sin PDF (comprobante no aceptado) no aparece', async () => {
    shareSupport(true)
    open({}, { has_pdf: false })

    expect(await screen.findByRole('button', { name: 'Descargar XML' })).toBeInTheDocument()
    expect(screen.queryByRole('button', SHARE)).not.toBeInTheDocument()
  })

  it('si la persona cancela la hoja de compartir no muestra error', async () => {
    const share = shareSupport(true, () => Promise.reject(new DOMException('Cancelado', 'AbortError')))
    const { api, user } = open({})
    api.on('get', PDF_FILE, pdfResponse())

    await user.click(await screen.findByRole('button', SHARE))

    await waitFor(() => {
      expect(share).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByRole('button', SHARE)).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si el navegador pide otro toque, deja el PDF listo y no lo vuelve a bajar', async () => {
    const share = shareSupport(true, () => Promise.reject(new DOMException('Sin gesto', 'NotAllowedError')))
    const { api, user } = open({})
    api.on('get', PDF_FILE, pdfResponse())

    await user.click(await screen.findByRole('button', SHARE))
    share.mockImplementation(() => Promise.resolve())
    await user.click(await screen.findByRole('button', { name: 'Tocar para compartir' }))

    expect(await screen.findByRole('button', SHARE)).toBeInTheDocument()
    expect(share).toHaveBeenCalledTimes(2)
    expect(api.calls('get', PDF_FILE)).toHaveLength(1)
  })

  it('si el PDF no está disponible lo dice en español', async () => {
    shareSupport(true)
    const { api, user } = open({})
    api.on('get', PDF_FILE, new ErrorResponse(409, 'x', 'invoice_document_unavailable'))

    await user.click(await screen.findByRole('button', SHARE))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese archivo del comprobante todavía no está disponible.')
  })
})

describe('IssuedInvoice: enviar por correo', () => {
  it('«Enviar por correo» solo aparece con el correo activo', async () => {
    open({ email_enabled: false })
    await screen.findByRole('button', DOWNLOAD_PDF)
    expect(screen.queryByRole('button', SEND_EMAIL)).not.toBeInTheDocument()
  })

  it('envía el comprobante al correo escrito y avisa con el destino enmascarado', async () => {
    const { api, user } = open({ email_enabled: true })
    api.on('post', EMAIL, { sent: true, masked_to: 'r•••@correo.pe' })

    await user.click(await screen.findByRole('button', SEND_EMAIL))
    const dialog = within(await screen.findByRole('dialog', EMAIL_DIALOG))
    expect(dialog.getByRole('button', SEND)).toBeDisabled()
    await user.type(dialog.getByLabelText(RECIPIENT), RECEIVER)
    await user.click(dialog.getByRole('button', SEND))

    expect(await screen.findByText('B001-15 enviado a r•••@correo.pe.')).toBeInTheDocument()
    expect(api.calls('post', EMAIL)[0]?.body).toEqual({ to_email: RECEIVER, to_name: '' })
  })

  it('muestra en español por qué no salió el correo', async () => {
    const { api, user } = open({ email_enabled: true })
    api.on('post', EMAIL, new ErrorResponse(409, 'x', 'invalid_invoice'))

    await user.click(await screen.findByRole('button', SEND_EMAIL))
    const dialog = within(await screen.findByRole('dialog', EMAIL_DIALOG))
    await user.type(dialog.getByLabelText(RECIPIENT), RECEIVER)
    await user.click(dialog.getByRole('button', SEND))

    expect(await dialog.findByText('Este comprobante no se puede enviar por correo.')).toBeInTheDocument()
  })

  it('sin permiso de emitir no ofrece enviar', () => {
    open({ email_enabled: true }, {}, PERMISSIONS_WAITER)

    expect(screen.queryByRole('button', SEND_EMAIL)).not.toBeInTheDocument()
  })
})
