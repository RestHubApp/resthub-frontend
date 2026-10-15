import { useInvoiceDownload, type DownloadableInvoice } from '@/hooks/useInvoiceDownload'
import { FormMessage } from './FormMessage'
import { Icon } from './Icon'
import { Button } from './ui/button'

/** Los botones para bajar el PDF, el XML y el CDR de un comprobante, solo los que existen. */
export function InvoiceDownloads({ invoice }: { readonly invoice: DownloadableInvoice }) {
  const { files, download, pending, error } = useInvoiceDownload(invoice)

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
