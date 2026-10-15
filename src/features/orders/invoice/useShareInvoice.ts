import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

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
 */
export function useShareInvoice(invoice: Invoice, restaurantName: string) {
  const [ready, setReady] = useState<File | null>(null)
  const title = `${invoice.kind_label} ${invoice.code}`
  const text = [restaurantName, title, `Total ${formatMoney(invoice.total)}`].filter((part) => part !== '').join(' · ')
  const share = useMutation({
    mutationFn: async () => {
      const file = ready ?? (await pdfFile(invoice))
      try {
        await navigator.share({ files: [file], title, text })
        setReady(null)
      } catch (error) {
        if (isError(error, 'AbortError')) return
        if (isError(error, 'NotAllowedError') && ready === null) {
          setReady(file)
          return
        }
        throw error
      }
    },
  })
  return {
    share: () => {
      share.mutate()
    },
    isPending: share.isPending,
    isReady: ready !== null,
    error: share.isError ? billingErrorMessage(share.error, 'No se pudo compartir el comprobante.') : null,
  }
}
