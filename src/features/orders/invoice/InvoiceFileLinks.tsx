import type { Invoice } from '@/api/types'
import { isHttpsUrl } from './invoiceLinks'

export const INVOICE_LINK_CLASS = 'text-primary underline'

/** Los archivos del comprobante que dan el proveedor y el respaldo: PDF, XML y CDR. Solo los que existen y son https. */
export function InvoiceFileLinks({ invoice }: { readonly invoice: Invoice }) {
  const files = [
    { label: 'PDF', url: invoice.pdf_url },
    { label: 'XML', url: invoice.xml_url },
    { label: 'CDR', url: invoice.cdr_url },
  ].filter((file) => isHttpsUrl(file.url))

  return files.map((file) => (
    <a key={file.label} href={file.url} target="_blank" rel="noopener noreferrer" className={INVOICE_LINK_CLASS}>
      {file.label}
    </a>
  ))
}
