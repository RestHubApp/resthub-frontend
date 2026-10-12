import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { activityQueryKey } from '@/api/activity'
import { sendInvoiceEmail } from '@/api/billing'
import type { Invoice } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { FormMessage } from '@/components/FormMessage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNotifications } from '@/store/notifications'
import { emailErrorMessage } from './emailMessages'

interface InvoiceEmailDialogProps {
  readonly invoice: Invoice
  readonly open: boolean
  readonly maxPerHour: number
  readonly onClose: () => void
}

/** Un correo con forma de correo (algo@dominio.ext): lo demás lo valida el servidor. */
function looksLikeEmail(value: string): boolean {
  const [local = '', domain = '', ...rest] = value.split('@')
  return rest.length === 0 && local !== '' && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.') && !value.includes(' ')
}

/**
 * «Enviar por correo»: pide el correo al que va el comprobante (se escribe acá;
 * no se guarda en ninguna ficha) y lo envía. El servidor responde con el destino
 * ya enmascarado y eso es lo que se avisa.
 */
export function InvoiceEmailDialog({ invoice, open, maxPerHour, onClose }: InvoiceEmailDialogProps) {
  const [email, setEmail] = useState('')
  const push = useNotifications((state) => state.push)
  const queryClient = useQueryClient()
  const send = useMutation({
    mutationFn: () => sendInvoiceEmail(invoice.id, { to_email: email.trim(), to_name: '' }),
    onSuccess: (sent) => {
      void queryClient.invalidateQueries({ queryKey: activityQueryKey })
      push({ tone: 'info', message: `${invoice.code} enviado a ${sent.masked_to}.` })
      setEmail('')
      onClose()
    },
  })
  const isValid = looksLikeEmail(email.trim())

  return (
    <FormDialog
      open={open}
      title="Enviar por correo"
      description={`${invoice.kind_label} ${invoice.code}. Recibirá el enlace al PDF.`}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comprobante-correo">Correo de quien lo recibe</Label>
        <Input id="comprobante-correo" type="email" autoComplete="off" value={email} onChange={(event) => {
          setEmail(event.target.value)
        }} />
        {email.trim() === '' || isValid ? null : <p className="m-0 text-xs text-muted-foreground">Escribe un correo válido.</p>}
      </div>
      {send.isError ? <FormMessage tone="error">{emailErrorMessage(send.error, maxPerHour)}</FormMessage> : null}
      <FormFooter
        mutation={send}
        onCancel={onClose}
        submit={{ label: 'Enviar', pendingLabel: 'Enviando…', onClick: () => {
          send.mutate()
        }, isDisabled: !isValid || send.isPending }}
      />
    </FormDialog>
  )
}
