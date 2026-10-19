import { type DocumentFetcher, useInvoiceDownload, type DownloadableInvoice } from '@/hooks/useInvoiceDownload'
import { FormMessage } from './FormMessage'
import { Icon } from './Icon'
import { Button } from './ui/button'

interface InvoiceDownloadsProps {
  readonly invoice: DownloadableInvoice
  /** Para los archivos de una nota de crédito; por omisión, los del comprobante. */
  readonly fetchFile?: DocumentFetcher
  /** Lo que sigue a «Descargar PDF» en el nombre accesible, para distinguir la nota del comprobante. */
  readonly of?: string
}

/** Los botones para bajar el PDF, el XML y el CDR de un comprobante, solo los que existen. */
export function InvoiceDownloads({ invoice, fetchFile, of }: InvoiceDownloadsProps) {
  const { files, download, pending, error } = useInvoiceDownload(invoice, fetchFile)

  return (
    <>
      {files.map((file) => (
        <Button
          key={file.format}
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending !== null}
          onClick={() => {
            download(file)
          }}
        >
          <Icon name="download" size={14} />
          <span>{pending === file.format ? 'Descargando…' : `Descargar ${file.label}`}</span>
          {of === undefined ? null : <span className="sr-only"> {of}</span>}
        </Button>
      ))}
      {error === null ? null : (
        <div className="basis-full">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}
    </>
  )
}
