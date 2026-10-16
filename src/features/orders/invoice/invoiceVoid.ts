import type { CreditNote, Invoice } from '@/api/types'

/** Los motivos que más se repiten al anular un comprobante: un toque y listo. */
export const QUICK_INVOICE_VOID_REASONS = ['El cliente pidió factura', 'Datos del cliente errados', 'Cliente pidió boleta'] as const

/** Los mismos topes que el servidor: el motivo viaja a SUNAT en la nota de crédito. */
export const MIN_INVOICE_VOID_REASON = 3
export const MAX_INVOICE_VOID_REASON = 200

/**
 * Cómo se anula un comprobante según su estado:
 * - `creditNote`: SUNAT lo aceptó, se anula con una nota de crédito.
 * - `local`: simulado o rechazado, nunca fue válido ante SUNAT: se anula sin nota.
 * - `resendFirst`: pendiente, primero hay que reenviarlo.
 * - `noteInProgress`: su nota de crédito quedó en curso; se reenvía la nota.
 * - `voided`: ya está anulado.
 */
export type VoidPath = 'creditNote' | 'local' | 'resendFirst' | 'noteInProgress' | 'voided'

export function voidPath(invoice: Invoice): VoidPath {
  if (invoice.is_voided) return 'voided'
  if (invoice.credit_note !== null) return 'noteInProgress'
  switch (invoice.status) {
    case 'accepted': {
      return 'creditNote'
    }
    case 'pending': {
      return 'resendFirst'
    }
    case 'simulated':
    case 'rejected': {
      return 'local'
    }
  }
}

/** Si el comprobante se puede anular ahora mismo. */
export function canVoidNow(path: VoidPath): boolean {
  return path === 'creditNote' || path === 'local'
}

/** «la boleta B001-12»: el nombre del comprobante dentro de una frase. */
export function invoiceName(invoice: Pick<Invoice, 'kind' | 'code'>): string {
  return `la ${invoice.kind} ${invoice.code}`
}

const NEVER_VALID = { simulated: 'es una simulación', rejected: 'SUNAT la rechazó' } as const

function localReason(invoice: Invoice): string {
  return invoice.status === 'simulated' ? NEVER_VALID.simulated : NEVER_VALID.rejected
}

/**
 * Qué va a pasar, en lenguaje simple, antes de anular. `willReissue` dice si
 * después se emite el comprobante nuevo (cambiar) o el pedido queda sin
 * comprobante (anular).
 */
export function voidExplanation(invoice: Invoice, willReissue: boolean): string {
  const name = invoiceName(invoice)
  const then = willReissue ? ' y luego se emitirá el comprobante nuevo.' : '. El pedido quedará sin comprobante y podrás emitir otro.'
  switch (voidPath(invoice)) {
    case 'creditNote': {
      return `Se enviará a SUNAT una nota de crédito que anula ${name}${then}`
    }
    case 'local': {
      return `${capitalize(name)} nunca fue válida ante SUNAT (${localReason(invoice)}): se anula solo en RestHub, sin nota de crédito,${then}`
    }
    case 'resendFirst': {
      return `${capitalize(name)} todavía espera la respuesta de SUNAT. Primero reenvíala; cuando SUNAT la acepte o la rechace, podrás anularla.`
    }
    case 'noteInProgress': {
      return `La nota de crédito que anula ${name} todavía no fue aceptada. Reenvía la nota: el comprobante queda anulado cuando SUNAT la acepte.`
    }
    case 'voided': {
      return `${capitalize(name)} ya está anulada.`
    }
  }
}

/** La frase con mayúscula inicial: «La boleta B001-12…». */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Cómo terminó: anulado (y, si se cambió, el nuevo) o con la nota de crédito todavía en curso. */
export function voidOutcome(voided: Invoice, issued: Invoice | null): { readonly tone: 'info' | 'warning'; readonly message: string } {
  const name = capitalize(invoiceName(voided))
  if (!voided.is_voided && voided.credit_note !== null) {
    return { tone: 'warning', message: pendingNoteMessage(voided, voided.credit_note) }
  }
  if (issued === null) {
    return { tone: 'info', message: `${name} quedó anulada.` }
  }
  return { tone: 'info', message: `${name} quedó anulada y se emitió ${invoiceName(issued)}.` }
}

function pendingNoteMessage(invoice: Invoice, note: CreditNote): string {
  return `La nota de crédito ${note.code} quedó «${note.status_label}»: ${invoiceName(invoice)} sigue vigente hasta que SUNAT la acepte. Reenvía la nota desde el comprobante.`
}
