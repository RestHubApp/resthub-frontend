import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { invoice, taxSettings } from '#jest/fixtures/panel'
import { mountScreen, server, signInAs } from '#jest/harness'
import type { Invoice } from '@/api/types'
import { BillingScreen } from './BillingScreen'

const LIST = '/billing/invoices'
const VOID = '/billing/invoices/5/void'
const SIMULATED = { status: 'simulated', status_label: 'Simulada' } as const
const VOID_ACTION = { name: 'Anular comprobante' }
const REASON = 'El cliente pidió factura'

const VOIDED = invoice({
  ...SIMULATED,
  is_voided: true,
  voided_at: '2026-10-15T23:59:07Z',
  void_reason: REASON,
})
const REPLACEMENT = invoice({ id: 6, kind: 'factura', kind_label: 'Factura', series: 'F001', number: 4, code: 'F001-4', replaces_invoice_id: 5 })

function open(items: Invoice[]) {
  const api = server()
    .on('get', '/billing/settings', taxSettings())
    .on('get', LIST, { items, total: items.length })
    .on('get', '/billing/invoices/5', VOIDED)
  signInAs()
  return { api, ...mountScreen(<BillingScreen />) }
}

describe('Comprobantes: anulados y reemplazos en el listado', () => {
  it('el anulado dice el motivo y no se reenvía; el nuevo dice a cuál reemplaza y se puede cambiar', async () => {
    open([REPLACEMENT, VOIDED])

    expect(await screen.findByText(`Anulado: ${REASON}`)).toBeInTheDocument()
    expect(await screen.findByText('Reemplaza a B001-12')).toBeInTheDocument()
    // Solo la factura vigente ofrece cambiar o anular; el anulado, aunque simulado, no se reenvía.
    expect(screen.getAllByRole('button', VOID_ACTION)).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Cambiar comprobante' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Reenviar' })).not.toBeInTheDocument()
  })

  it('anula desde el listado un simulado, sin nota, y la fila queda anulada', async () => {
    const { api, user } = open([invoice(SIMULATED)])
    api.on('post', VOID, () => {
      api.on('get', LIST, { items: [VOIDED], total: 1 })
      return VOIDED
    })

    await user.click(await screen.findByRole('button', VOID_ACTION))
    const dialog = within(await screen.findByRole('dialog', { name: 'Anular la boleta B001-12' }))
    await user.click(dialog.getByRole('button', { name: REASON }))
    await user.click(dialog.getByRole('button', VOID_ACTION))

    expect(await screen.findByText(`Anulado: ${REASON}`)).toBeInTheDocument()
    expect(api.calls('post', VOID)[0]?.body).toEqual({ reason: REASON })
  })
})
