import { useMutation } from '@tanstack/react-query'

import { downloadInvoiceDocument } from '@/api/billing'
import type { Invoice, InvoiceDocumentFormat } from '@/api/types'
import { billingErrorMessage } from '@/services/billingErrors'
import { saveFile } from '@/services/download'

/** Lo que hace falta de un comprobante para bajar sus archivos. */
export type DownloadableInvoice = Pick<Invoice, 'id' | 'code' | 'has_pdf' | 'has_xml' | 'has_cdr'>

/** Un archivo del comprobante que se puede bajar. */
export interface InvoiceFile {
  readonly format: InvoiceDocumentFormat
  readonly label: string
  /** Lo que sigue a la serie y el número en el nombre del archivo. */
  readonly suffix: string
}

const FILES: readonly InvoiceFile[] = [
  { format: 'pdf', label: 'PDF', suffix: '.pdf' },
  { format: 'xml', label: 'XML', suffix: '.xml' },
  { format: 'cdr', label: 'CDR', suffix: '-cdr.zip' },
]

function hasFile(invoice: DownloadableInvoice, format: InvoiceDocumentFormat): boolean {
  switch (format) {
    case 'pdf': {
      return invoice.has_pdf
    }
    case 'xml': {
      return invoice.has_xml
    }
    case 'cdr': {
      return invoice.has_cdr
    }
  }
}

/**
 * Los archivos que tiene un comprobante (el PDF solo si SUNAT lo aceptó) y
 * cómo bajarlos: RestHub los sirve con la sesión, así que se piden con el
 * cliente del API y se entregan al navegador como un archivo `B001-12.pdf`.
 */
export function useInvoiceDownload(invoice: DownloadableInvoice) {
  const download = useMutation({
    mutationFn: async (file: InvoiceFile) => {
      saveFile(await downloadInvoiceDocument(invoice.id, file.format), `${invoice.code}${file.suffix}`)
    },
  })
  return {
    files: FILES.filter((file) => hasFile(invoice, file.format)),
    download: download.mutate,
    pending: download.isPending ? download.variables.format : null,
    error: download.isError ? billingErrorMessage(download.error, 'No se pudo descargar el archivo.') : null,
  }
}
