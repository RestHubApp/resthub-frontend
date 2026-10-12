import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { billingCapabilitiesQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { Invoice } from '@/api/types'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { InvoiceEmailDialog } from './InvoiceEmailDialog'
import { INVOICE_LINK_CLASS, InvoiceFileLinks } from './InvoiceFileLinks'
import { isHttpsUrl, whatsappLink } from './invoiceLinks'

interface InvoiceShareProps {
  readonly invoice: Invoice
  /** El teléfono del cliente, si el pedido lo trae; sin él, WhatsApp deja elegir a quién enviarlo. */
  readonly customerPhone?: string
}

/**
 * Lo que se hace con un comprobante ya emitido: abrir su PDF, bajar el XML y el
 * CDR si existen, enviarlo por WhatsApp (sin API: abre `wa.me` con el enlace) y,
 * si el restaurante tiene el correo activo, enviarlo por correo. Los enlaces
 * vienen de terceros: solo se usan si son https.
 */
export function InvoiceShare({ invoice, customerPhone = '' }: InvoiceShareProps) {
  const canIssue = useCan(PERMISSION.billingIssue)
  const capabilities = useQuery({ ...billingCapabilitiesQuery, enabled: canIssue })
  const [isEmailing, setIsEmailing] = useState(false)
  const canWhatsapp = canIssue && isHttpsUrl(invoice.pdf_url)

  return (
    <>
      <InvoiceFileLinks invoice={invoice} />
      {canWhatsapp ? (
        <a
          href={whatsappLink(customerPhone, { label: `${invoice.kind_label} ${invoice.code}`, pdfUrl: invoice.pdf_url })}
          target="_blank"
          rel="noopener noreferrer"
          className={INVOICE_LINK_CLASS}
        >
          Enviar por WhatsApp
        </a>
      ) : null}
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
