import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { buildOrder, invoice, paid, payment } from '#jest/fixtures/charge'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import type { CreditNote, Invoice } from '@/api/types'
import { InvoicePanel } from './InvoicePanel'

const OF_ORDER = '/billing/orders/12/invoice'
const VOID = '/billing/invoices/90/void'
const ISSUE = '/billing/invoices'
const RESEND_NOTE = '/billing/credit-notes/1/resend'
const VOID_ACTION = { name: 'Anular comprobante' }
const CHANGE_ACTION = { name: 'Cambiar comprobante' }
const ISSUE_ANOTHER = { name: 'Emitir boleta o factura' }
const VOID_AND_ISSUE = { name: 'Anular y emitir factura' }
const PENDING = 'Pendiente de envío'
const WANTS_FACTURA = 'El cliente pidió factura'
const DUPLICATE = 'Pedido duplicado'
const VOIDED_TEXT = `Anulado: ${DUPLICATE}`

function creditNote(changes: Partial<CreditNote> = {}): CreditNote {
  return {
    id: 1,
    invoice_id: 90,
    code: 'BC01-1',
    series: 'BC01',
    number: 1,
    reason_code: '01',
    reason_label: 'Anulación de la operación',
    reason: DUPLICATE,
    total: '50.00',
    status: 'accepted',
    status_label: 'Aceptada por SUNAT',
    provider_message: '',
    has_pdf: true,
    has_xml: true,
    has_cdr: true,
    issued_at: '2026-10-15T23:59:07Z',
    ...changes,
  }
}

function voidedWith(reason: string, note: CreditNote | null = creditNote({ reason })): Invoice {
  return invoice({
    is_voided: true,
    voided_at: '2026-10-15T23:59:07Z',
    void_reason: reason,
    credit_note_id: note?.id ?? null,
    credit_note: note,
  })
}

function open(current: Invoice, permissions = PERMISSIONS_OWNER) {
  const api = server().on('get', OF_ORDER, current)
  signInAs(permissions)
  const order = paid(buildOrder({ total: '50.00', balance: '50.00' }), payment({ amount: '50.00' }))
  return { api, ...mountScreen(<InvoicePanel order={order} />) }
}

// Como el servidor: lo que responde pasa a ser el comprobante del pedido.
function answer(api: ReturnType<typeof server>, path: string, result: Invoice) {
  api.on('post', path, () => {
    api.on('get', OF_ORDER, result)
    return result
  })
}

describe('Anular un comprobante según su estado', () => {
  it('aceptado: anula con nota de crédito, la muestra con sus archivos y vuelve a ofrecer emitir', async () => {
    const { api, user } = open(invoice())
    answer(api, VOID, voidedWith(DUPLICATE))

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog', { name: 'Anular la boleta B001-15' }))
    expect(dialog.getByText('Se enviará a SUNAT una nota de crédito que anula la boleta B001-15. El pedido quedará sin comprobante y podrás emitir otro.')).toBeInTheDocument()
    await user.type(dialog.getByLabelText('Motivo de la anulación'), DUPLICATE)
    await user.click(dialog.getByRole('button', VOID_ACTION))

    expect(await screen.findByText(VOIDED_TEXT)).toBeInTheDocument()
    expect(screen.getByText('Nota de crédito BC01-1 · Aceptada por SUNAT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar PDF de la nota BC01-1' })).toBeInTheDocument()
    expect(screen.getByRole('button', ISSUE_ANOTHER)).toBeInTheDocument()
    expect(screen.queryByRole('button', VOID_ACTION)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Imprimir' })).not.toBeInTheDocument()
    expect(api.calls('post', VOID)[0]?.body).toEqual({ reason: DUPLICATE })
  })

  it('simulado: explica que nunca fue válido ante SUNAT y se anula sin nota', async () => {
    const { api, user } = open(invoice({ status: 'simulated', status_label: 'Simulada' }))
    answer(api, VOID, voidedWith('Datos del cliente errados', null))

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText(/nunca fue válida ante SUNAT \(es una simulación\): se anula solo en RestHub, sin nota de crédito/u)).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Datos del cliente errados' }))
    await user.click(dialog.getByRole('button', VOID_ACTION))

    expect(await screen.findByText('Anulado: Datos del cliente errados')).toBeInTheDocument()
    expect(screen.queryByText(/Nota de crédito/u)).not.toBeInTheDocument()
  })

  it('rechazado: también se anula sin nota, y lo explica', async () => {
    const { user } = open(invoice({ status: 'rejected', status_label: 'Rechazada' }))

    await user.click(await screen.findByRole('button', VOID_ACTION))
    expect(await screen.findByText(/nunca fue válida ante SUNAT \(SUNAT la rechazó\)/u)).toBeInTheDocument()
  })

  it('pendiente: explica que primero hay que reenviarlo y no ofrece anular', async () => {
    const { api, user } = open(invoice({ status: 'pending', status_label: PENDING }))

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText(/todavía espera la respuesta de SUNAT\. Primero reenvíala/u)).toBeInTheDocument()
    expect(dialog.queryByRole('button', VOID_ACTION)).not.toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Entendido' }))
    expect(api.calls('post', VOID)).toHaveLength(0)
  })

  it('ya anulado: no ofrece anular ni cambiar, y sí emitir otro', async () => {
    open(voidedWith(DUPLICATE))

    expect(await screen.findByText(VOIDED_TEXT)).toBeInTheDocument()
    expect(screen.getByRole('button', ISSUE_ANOTHER)).toBeInTheDocument()
    expect(screen.queryByRole('button', VOID_ACTION)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', CHANGE_ACTION)).not.toBeInTheDocument()
  })

  it('si otra persona lo anuló mientras tanto, lo dice con palabras simples', async () => {
    const { api, user } = open(invoice())
    api.on('post', VOID, new ErrorResponse(409, 'El comprobante ya está anulado.', 'invoice_already_voided'))

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Cliente pidió boleta' }))
    await user.click(dialog.getByRole('button', VOID_ACTION))

    expect(await dialog.findByText('Ese comprobante ya estaba anulado. La pantalla se actualizó.')).toBeInTheDocument()
  })

  it('el motivo es obligatorio: sin él no se envía nada', async () => {
    const { api, user } = open(invoice())

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog'))
    await user.click(dialog.getByRole('button', VOID_ACTION))

    expect(await dialog.findByText('Escribe el motivo, de al menos 3 caracteres')).toBeInTheDocument()
    expect(api.calls('post', VOID)).toHaveLength(0)
  })

  it('sin billing.manage se ve el comprobante, pero no se anula ni se cambia', async () => {
    open(invoice(), PERMISSIONS_OWNER.filter((code) => code !== 'billing.manage'))

    expect(await screen.findByText('Boleta B001-15')).toBeInTheDocument()
    expect(screen.queryByRole('button', VOID_ACTION)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', CHANGE_ACTION)).not.toBeInTheDocument()
  })
})

const NEW_FACTURA = invoice({
  id: 91,
  kind: 'factura',
  kind_label: 'Factura',
  series: 'F001',
  number: 3,
  code: 'F001-3',
  customer_document_type: 'ruc',
  replaces_invoice_id: 90,
})

async function changeToFactura(user: ReturnType<typeof open>['user']) {
  await user.click(await screen.findByRole('button', CHANGE_ACTION))
  const dialog = within(await screen.findByRole('dialog', { name: 'Cambiar la boleta B001-15' }))
  expect(dialog.getByText('Se enviará a SUNAT una nota de crédito que anula la boleta B001-15 y luego se emitirá el comprobante nuevo.')).toBeInTheDocument()
  await user.click(dialog.getByRole('button', { name: WANTS_FACTURA }))
  await user.click(dialog.getByRole('button', { name: 'Siguiente' }))
  expect(await dialog.findByText('Datos del nuevo comprobante')).toBeInTheDocument()
  expect(dialog.getByRole('button', { name: 'Factura' })).toHaveAttribute('aria-pressed', 'true')
  await user.type(dialog.getByLabelText('RUC'), '20123456789')
  await user.type(dialog.getByLabelText('Razón social'), 'Inversiones Sol SAC')
  return dialog
}

describe('Cambiar una boleta por una factura', () => {
  it('anula la boleta, emite la factura y la nueva dice a cuál reemplaza', async () => {
    const { api, user } = open(invoice())
    const voided = voidedWith(WANTS_FACTURA)
    api.on('post', VOID, voided).on('get', '/billing/invoices/90', voided)
    answer(api, ISSUE, NEW_FACTURA)

    const dialog = await changeToFactura(user)
    await user.click(dialog.getByRole('button', VOID_AND_ISSUE))

    expect(await screen.findByText('Factura F001-3')).toBeInTheDocument()
    expect(await screen.findByText('Reemplaza a B001-15')).toBeInTheDocument()
    expect(screen.queryByRole('button', ISSUE_ANOTHER)).not.toBeInTheDocument()
    expect(api.requests.filter((request) => request.method === 'post').map((request) => request.url)).toEqual([VOID, ISSUE])
    expect(api.calls('post', VOID)[0]?.body).toEqual({ reason: WANTS_FACTURA })
    expect(api.calls('post', ISSUE)[0]?.body).toMatchObject({
      order_id: 12,
      kind: 'factura',
      customer_document_type: 'ruc',
      customer_document_number: '20123456789',
      customer_name: 'Inversiones Sol SAC',
    })
  })

  it('si se anuló pero la emisión falló, lo dice y el reintento solo emite', async () => {
    const { api, user } = open(invoice())
    api.on('post', VOID, voidedWith(WANTS_FACTURA))
    answer(api, ISSUE, NEW_FACTURA)
    api.once('post', ISSUE, new ErrorResponse(503, 'Sin respuesta.', 'billing_provider'))

    const dialog = await changeToFactura(user)
    await user.click(dialog.getByRole('button', VOID_AND_ISSUE))

    expect(await dialog.findByText('La boleta B001-15 ya quedó anulada, pero no se pudo emitir el nuevo: El servicio de facturación no está disponible, intenta en unos minutos.')).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Emitir factura' }))

    expect(await screen.findByText('Factura F001-3')).toBeInTheDocument()
    expect(api.calls('post', VOID)).toHaveLength(1)
    expect(api.calls('post', ISSUE)).toHaveLength(2)
  })

  it('si la nota de crédito queda pendiente, no emite: la boleta sigue vigente hasta reenviarla', async () => {
    const { api, user } = open(invoice())
    const inProgress = invoice({ credit_note_id: 1, credit_note: creditNote({ status: 'pending', status_label: PENDING, has_pdf: false, has_cdr: false }) })
    answer(api, VOID, inProgress)

    const dialog = await changeToFactura(user)
    await user.click(dialog.getByRole('button', VOID_AND_ISSUE))

    expect(await screen.findByText('Anulación en curso · Nota de crédito BC01-1 · Pendiente de envío')).toBeInTheDocument()
    expect(api.calls('post', ISSUE)).toHaveLength(0)
  })
})

describe('La nota de crédito en curso', () => {
  it('pendiente: muestra su estado y «Reenviar nota»; al aceptarla, el comprobante queda anulado', async () => {
    const pending = creditNote({ status: 'pending', status_label: PENDING, has_pdf: false, has_cdr: false })
    const { api, user } = open(invoice({ credit_note_id: 1, credit_note: pending }))
    answer(api, RESEND_NOTE, voidedWith(DUPLICATE))

    expect(await screen.findByText('Anulación en curso · Nota de crédito BC01-1 · Pendiente de envío')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar XML de la nota BC01-1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Descargar PDF de la nota BC01-1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', VOID_ACTION)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', ISSUE_ANOTHER)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reenviar nota' }))

    expect(await screen.findByText(VOIDED_TEXT)).toBeInTheDocument()
    expect(screen.getByText('Nota de crédito BC01-1 · Aceptada por SUNAT')).toBeInTheDocument()
    expect(screen.getByRole('button', ISSUE_ANOTHER)).toBeInTheDocument()
    expect(api.calls('post', RESEND_NOTE)).toHaveLength(1)
  })

  it('rechazada: muestra el motivo de SUNAT y deja reenviarla', async () => {
    const rejected = creditNote({ status: 'rejected', status_label: 'Rechazada', provider_message: 'El RUC del emisor no coincide.' })
    open(invoice({ credit_note_id: 1, credit_note: rejected }))

    expect(await screen.findByText('El RUC del emisor no coincide.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar nota' })).toBeInTheDocument()
  })
})
