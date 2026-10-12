import { useMutation, useQueryClient } from '@tanstack/react-query'

import { archiveInvoice, billingQueryKey } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { ErrorCode, Invoice } from '@/api/types'
import { Button } from '@/components/ui/button'
import { errorCode } from '@/services/apiError'
import { useNotifications } from '@/store/notifications'
import { useCan } from '@/store/session'

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  archive_disabled: 'El respaldo en Google Drive no está activado.',
  invalid_invoice: 'Este comprobante no se puede respaldar.',
}

function archiveErrorMessage(error: unknown): string {
  const code = errorCode(error)
  return (code === undefined ? undefined : MESSAGES[code]) ?? 'No se pudo pedir el respaldo. Vuelve a intentarlo.'
}

/**
 * El estado del respaldo del comprobante en Google Drive, discreto, para quien
 * gestiona la facturación. Si falló, ofrece «Reintentar respaldo». Con el
 * respaldo apagado no muestra nada.
 */
export function InvoiceArchiveStatus({ invoice }: { readonly invoice: Invoice }) {
  const canManage = useCan(PERMISSION.billingManage)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const retry = useMutation({
    mutationFn: () => archiveInvoice(invoice.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      push({ tone: 'info', message: `${invoice.code}: respaldo pedido.` })
    },
    onError: (error) => {
      push({ tone: 'warning', message: archiveErrorMessage(error) })
    },
  })

  if (!canManage || invoice.archive_status === 'disabled') {
    return null
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span title={invoice.archive_message === '' ? undefined : invoice.archive_message}>Respaldo: {invoice.archive_status_label}</span>
      {invoice.archive_status === 'failed' ? (
        <Button type="button" size="sm" variant="outline" disabled={retry.isPending} onClick={() => {
          retry.mutate()
        }}>
          {retry.isPending ? 'Pidiendo…' : 'Reintentar respaldo'}
        </Button>
      ) : null}
    </span>
  )
}
