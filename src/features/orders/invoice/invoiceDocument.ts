import type { DocumentType, InvoiceKind } from '../../../api/types'

// Sobre este monto una boleta necesita el documento del cliente (SUNAT).
const LIMITE_ANONIMA = 70000

export interface DocumentOption {
  readonly value: DocumentType
  readonly label: string
}

const DOCUMENTOS: readonly DocumentOption[] = [
  { value: 'none', label: 'Sin documento (clientes varios)' },
  { value: 'dni', label: 'DNI' },
  { value: 'ce', label: 'Carné de extranjería' },
  { value: 'ruc', label: 'RUC' },
]

const SOLO_RUC = DOCUMENTOS.filter((d) => d.value === 'ruc')
const CON_DOCUMENTO = DOCUMENTOS.filter((d) => d.value !== 'none')

/** Los documentos que acepta el comprobante: la factura va con RUC y una boleta grande no va a «clientes varios». */
export function documentOptions(kind: InvoiceKind, totalCents: number): readonly DocumentOption[] {
  if (kind === 'factura') {
    return SOLO_RUC
  }
  return totalCents > LIMITE_ANONIMA ? CON_DOCUMENTO : DOCUMENTOS
}

/** El documento que se muestra y se envía: el elegido si vale, si no el primero que vale. */
export function effectiveDocument(kind: InvoiceKind, chosen: DocumentType, totalCents: number): DocumentType {
  const opciones = documentOptions(kind, totalCents)
  return opciones.some((d) => d.value === chosen) ? chosen : (opciones[0]?.value ?? chosen)
}

/** Con documento, el número y el nombre son obligatorios; «clientes varios» no pide nada. */
export function customerComplete(document: DocumentType, numero: string, nombre: string): boolean {
  return document === 'none' || (numero.trim() !== '' && nombre.trim() !== '')
}
