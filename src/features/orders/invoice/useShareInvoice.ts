import { useState, useTransition } from 'react'

import { downloadInvoiceDocument } from '@/api/billing'
import type { Invoice } from '@/api/types'
import { billingErrorMessage } from '@/services/billingErrors'
import { formatMoney } from '@/services/format'

const PDF_TYPE = 'application/pdf'

/** Si el navegador comparte archivos (el celular sí; la mayoría de los escritorios, no). */
export function canShareFiles(): boolean {
  if (typeof navigator.canShare !== 'function') return false
  return navigator.canShare({ files: [new File([], 'comprobante.pdf', { type: PDF_TYPE })] })
}

/** El PDF bajado con la sesión, como el archivo `B001-12.pdf` que recibe la hoja de compartir. */
async function pdfFile(invoice: Invoice): Promise<File> {
  const pdf = await downloadInvoiceDocument(invoice.id, 'pdf')
  return new File([await pdf.arrayBuffer()], `${invoice.code}.pdf`, { type: PDF_TYPE })
}

function isError(error: unknown, name: string): boolean {
  return error instanceof DOMException && error.name === name
}

/**
 * Comparte el PDF del comprobante como archivo con la hoja de compartir del
 * sistema (WhatsApp, correo, lo que tenga el celular). El PDF se baja con la
 * sesión: ya no hay un enlace público que mandar.
 *
 * Si la descarga tardó y el navegador ya no considera el toque como reciente
 * (`NotAllowedError`), el archivo queda listo y basta con tocar otra vez.
 * Cancelar la hoja de compartir no es un error.
 *
 * No es una mutación: no cambia nada en el servidor, así que no hay caché que
 * refrescar. Basta una transición con su propio error.
 */
export function useShareInvoice(invoice: Invoice, restaurantName: string) {
  const [ready, setReady] = useState<File | null>(null)
  const title = `${invoice.kind_label} ${invoice.code}`
  const text = [restaurantName, title, `Total ${formatMoney(invoice.total)}`].filter((part) => part !== '').join(' · ')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<unknown>(null)

  async function shareFile() {
    const file = ready ?? (await pdfFile(invoice))
    try {
      await navigator.share({ files: [file], title, text })
      setReady(null)
    } catch (shareError) {
      if (isError(shareError, 'AbortError')) return
      if (isError(shareError, 'NotAllowedError') && ready === null) {
        setReady(file)
        return
      }
      throw shareError
    }
  }

  return {
    share: () => {
      setError(null)
      startTransition(async () => {
        try {
          await shareFile()
        } catch (shareError) {
          setError(shareError)
        }
      })
    },
    isPending,
    isReady: ready !== null,
    error: error === null ? null : billingErrorMessage(error, 'No se pudo compartir el comprobante.'),
  }
}
