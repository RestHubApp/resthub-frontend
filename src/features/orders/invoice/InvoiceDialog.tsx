import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { billingQueryKey, issueInvoice, orderInvoiceQueryKey } from '@/api/billing'
import type { DocumentType, InvoiceKind, IssueInvoiceRequest, OrderResponse } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { errorMessage } from '@/services/api'
import { formatMoney, toCents } from '@/services/format'
import { CustomerFields } from './CustomerFields'
import { customerComplete, documentOptions, effectiveDocument } from './invoiceDocument'

interface InvoiceDialogProps {
  readonly order: OrderResponse
  readonly open: boolean
  readonly onClose: () => void
}

/**
 * Emitir la boleta o la factura de un pedido pagado.
 *
 * La factura pide RUC y razón social; una boleta de hasta S/ 700 puede ir a
 * «clientes varios». El servidor valida lo mismo y lo envía al proveedor.
 */
export function InvoiceDialog({ order, open, onClose }: InvoiceDialogProps) {
  const [kind, setKind] = useState<InvoiceKind>('boleta')
  const [doc, setDoc] = useState<DocumentType>('none')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const queryClient = useQueryClient()
  const issue = useMutation({
    mutationFn: (payload: IssueInvoiceRequest) => issueInvoice(payload),
    onSuccess: (invoice) => {
      queryClient.setQueryData(orderInvoiceQueryKey(order.id), invoice)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      onClose()
    },
  })
  const total = toCents(order.total)
  const type = effectiveDocument(kind, doc, total)

  return (
    <FormDialog
      open={open}
      title={`Comprobante del pedido #${String(order.number)}`}
      description={`Total ${formatMoney(order.total)} (IGV incluido)`}
      onOpenChange={(abierto) => {
        if (!abierto) {
          onClose()
        }
      }}
    >
      <div role="group" aria-label="Tipo de comprobante" className="grid grid-cols-2 gap-2">
        {(['boleta', 'factura'] as const).map((option) => (
          <Button key={option} type="button" variant={kind === option ? 'default' : 'outline'} aria-pressed={kind === option} onClick={() => {
            setKind(option)
          }}>
            {option === 'boleta' ? 'Boleta' : 'Factura'}
          </Button>
        ))}
      </div>
      {kind === 'boleta' ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comprobante-documento">Documento del cliente</Label>
          <NativeSelect id="comprobante-documento" className="w-full" value={type} onChange={(e) => {
            setDoc(e.target.value as DocumentType)
          }}>
            {documentOptions(kind, total).map((d) => (
              <NativeSelectOption key={d.value} value={d.value}>{d.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <CustomerFields
        documentType={type}
        withAddress={kind === 'factura'}
        values={{ number, name, address }}
        onChange={(change) => {
          setNumber(change.number)
          setName(change.name)
          setAddress(change.address)
        }}
      />
      {issue.isError ? <FormMessage tone="error">{errorMessage(issue.error, 'No se pudo emitir el comprobante.')}</FormMessage> : null}
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={issue.isPending || !customerComplete(type, number, name)} onClick={() => {
          issue.mutate({
            order_id: order.id,
            kind,
            customer_document_type: type,
            customer_document_number: number.trim(),
            customer_name: name.trim(),
            customer_address: address.trim(),
          })
        }}>
          {issue.isPending ? 'Emitiendo…' : `Emitir ${kind}`}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
