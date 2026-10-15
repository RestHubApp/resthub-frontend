import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { billingCapabilitiesQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { Invoice } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { InvoiceEmailDialog } from './InvoiceEmailDialog'
import { ShareInvoiceButton } from './ShareInvoiceButton'
import { canShareFiles } from './useShareInvoice'

/**
 * Lo que se hace con un comprobante ya emitido: bajar su PDF, su XML y su CDR
 * si existen (RestHub los sirve con la sesión), compartir el PDF como archivo
 * donde el navegador puede (el celular; en el escritorio queda «Descargar PDF»)
 * y, si el restaurante tiene el correo activo, enviarlo por correo.
 */
export function InvoiceShare({ invoice }: { readonly invoice: Invoice }) {
  const canIssue = useCan(PERMISSION.billingIssue)
  const capabilities = useQuery({ ...billingCapabilitiesQuery, enabled: canIssue })
  const [isEmailing, setIsEmailing] = useState(false)
  const [canShare] = useState(canShareFiles)

  return (
    <>
      <InvoiceDownloads invoice={invoice} />
      {canIssue && canShare && invoice.has_pdf ? <ShareInvoiceButton invoice={invoice} /> : null}
      {capabilities.data?.email_enabled === true ? (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => {
            setIsEmailing(true)
          }}>
            Enviar por correo
          </Button>
          <InvoiceEmailDialog
            invoice={invoice}
            open={isEmailing}
            maxPerHour={capabilities.data.email_max_per_hour}
            onClose={() => {
              setIsEmailing(false)
            }}
          />
        </>
      ) : null}
    </>
  )
}
