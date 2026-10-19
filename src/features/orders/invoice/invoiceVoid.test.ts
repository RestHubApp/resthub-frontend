import { describe, expect, it } from '@jest/globals'

import { invoice } from '#jest/fixtures/charge'
import type { CreditNote } from '@/api/types'
import { canVoidNow, voidExplanation, voidOutcome, voidPath } from './invoiceVoid'

const NOTE: CreditNote = {
  id: 1, invoice_id: 90, code: 'BC01-1', series: 'BC01', number: 1, reason_code: '01', reason_label: 'Anulación de la operación',
  reason: 'Pedido duplicado', total: '50.00', status: 'pending', status_label: 'Pendiente de envío', provider_message: '',
  has_pdf: false, has_xml: true, has_cdr: false, issued_at: '2026-10-15T23:59:07Z',
}

describe('voidPath', () => {
  it.each([
    ['accepted', 'creditNote', true],
    ['simulated', 'local', true],
    ['rejected', 'local', true],
    ['pending', 'resendFirst', false],
  ] as const)('un comprobante %s se anula por «%s»', (status, path, canVoid) => {
    expect(voidPath(invoice({ status }))).toBe(path)
    expect(canVoidNow(voidPath(invoice({ status })))).toBe(canVoid)
  })

  it('con la nota en curso se reenvía la nota; ya anulado, nada', () => {
    expect(voidPath(invoice({ credit_note: NOTE }))).toBe('noteInProgress')
    expect(voidPath(invoice({ is_voided: true }))).toBe('voided')
    expect(voidExplanation(invoice({ credit_note: NOTE }), false)).toMatch(/^La nota de crédito que anula la boleta B001-15 todavía no fue aceptada/u)
  })
})

describe('voidOutcome', () => {
  it('anulado, y con el reemplazo cuando se cambió', () => {
    const voided = invoice({ is_voided: true })
    expect(voidOutcome(voided, null)).toEqual({ tone: 'info', message: 'La boleta B001-15 quedó anulada.' })
    expect(voidOutcome(voided, invoice({ kind: 'factura', code: 'F001-3' })).message).toBe('La boleta B001-15 quedó anulada y se emitió la factura F001-3.')
  })

  it('con la nota sin aceptar, avisa que sigue vigente', () => {
    expect(voidOutcome(invoice({ credit_note: NOTE }), null)).toEqual({
      tone: 'warning',
      message: 'La nota de crédito BC01-1 quedó «Pendiente de envío»: la boleta B001-15 sigue vigente hasta que SUNAT la acepte. Reenvía la nota desde el comprobante.',
    })
  })
})
