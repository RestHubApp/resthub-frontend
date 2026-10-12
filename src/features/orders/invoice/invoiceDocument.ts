import type { DocumentType, InvoiceKind } from '@/api/types'

// Sobre este monto una boleta necesita el documento del cliente (SUNAT).
const LIMIT_ANONYMOUS = 70000

export interface DocumentOption {
  readonly value: DocumentType
  readonly label: string
}

const DOCUMENTS: readonly DocumentOption[] = [
  { value: 'none', label: 'Sin documento (clientes varios)' },
  { value: 'dni', label: 'DNI' },
  { value: 'ce', label: 'Carné de extranjería' },
  { value: 'ruc', label: 'RUC' },
]

const ONLY_RUC = DOCUMENTS.filter((d) => d.value === 'ruc')
const WITH_DOCUMENT = DOCUMENTS.filter((d) => d.value !== 'none')

/** Los documentos que acepta el comprobante: la factura va con RUC y una boleta grande no va a «clientes varios». */
export function documentOptions(kind: InvoiceKind, totalCents: number): readonly DocumentOption[] {
  if (kind === 'factura') {
    return ONLY_RUC
  }
  return totalCents > LIMIT_ANONYMOUS ? WITH_DOCUMENT : DOCUMENTS
}

/** El documento que se muestra y se envía: el elegido si vale, si no el primero que vale. */
export function effectiveDocument(kind: InvoiceKind, chosen: DocumentType, totalCents: number): DocumentType {
  const options = documentOptions(kind, totalCents)
  return options.some((d) => d.value === chosen) ? chosen : (options[0]?.value ?? chosen)
}

/** Con documento, el número y el nombre son obligatorios; «clientes varios» no pide nada. */
export function customerComplete(document: DocumentType, number: string, name: string): boolean {
  return document === 'none' || (number.trim() !== '' && name.trim() !== '')
}
