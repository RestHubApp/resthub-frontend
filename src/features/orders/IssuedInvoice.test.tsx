import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { invoice } from '#jest/fixtures/charge'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { BillingCapabilities } from '@/api/types'
import { IssuedInvoice } from '@/features/orders/invoice/IssuedInvoice'

const CAPABILITIES = '/billing/capabilities'
const EMAIL = '/billing/invoices/90/email'
const SEND_EMAIL = { name: 'Enviar por correo' }
const SEND = { name: 'Enviar' }
const RECIPIENT = 'Correo de quien lo recibe'
const PDF = 'https://nubefact.example/b001-15.pdf'
const DRIVE = 'https://drive.example'
const RECEIVER = 'rosa@correo.pe'
const EMAIL_DIALOG = SEND_EMAIL
const WHATSAPP = { name: 'Enviar por WhatsApp' }
const PDF_LINK = { name: 'PDF' }
const CLEAR_PDF = 'http:' + '//nubefact.example/a.pdf'

function open(capabilities: Partial<BillingCapabilities>, changes = {}, permissions = PERMISSIONS_OWNER) {
  const api = server().on('get', CAPABILITIES, { email_enabled: false, email_max_per_hour: 20, archive_enabled: false, ...capabilities })
  signInAs(permissions)
  return { api, ...mountScreen(<IssuedInvoice invoice={invoice({ pdf_url: PDF, ...changes })} customerPhone="987654321" />) }
}

describe('IssuedInvoice: enviar y descargar', () => {
  it('muestra el PDF, el XML y el CDR si son https, y abre WhatsApp con el número del cliente', async () => {
    open({}, { xml_url: `${DRIVE}/x.xml`, cdr_url: `${DRIVE}/c.zip` })

    expect(await screen.findByRole('link', PDF_LINK)).toHaveAttribute('href', PDF)
    expect(screen.getByRole('link', { name: 'XML' })).toHaveAttribute('href', `${DRIVE}/x.xml`)
    expect(screen.getByRole('link', { name: 'CDR' })).toHaveAttribute('href', `${DRIVE}/c.zip`)
    const whatsapp = screen.getByRole('link', WHATSAPP)
    expect(whatsapp).toHaveAttribute('href', expect.stringMatching(/^https:\/\/wa\.me\/51987654321\?text=/u))
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
    expect(whatsapp).toHaveAttribute('target', '_blank')
  })

  it('no usa un enlace que no sea https', () => {
    open({}, { pdf_url: CLEAR_PDF, xml_url: 'javascript:alert(1)' })

    expect(screen.queryByRole('link', PDF_LINK)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'XML' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', WHATSAPP)).not.toBeInTheDocument()
  })

  it('«Enviar por correo» solo aparece con el correo activo', async () => {
    open({ email_enabled: false })
    await screen.findByRole('link', PDF_LINK)
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
    expect(screen.queryByRole('link', WHATSAPP)).not.toBeInTheDocument()
  })
})
