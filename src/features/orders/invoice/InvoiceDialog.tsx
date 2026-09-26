import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { billingQueryKey, issueInvoice, orderInvoiceQueryKey } from '../../../api/billing'
import type { DocumentType, InvoiceKind, IssueInvoiceRequest, OrderResponse } from '../../../api/types'
import DialogFormActions from '../../../components/DialogFormActions'
import FormDialog from '../../../components/FormDialog'
import FormMessage from '../../../components/FormMessage'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import { errorMessage } from '../../../services/api'
import { formatMoney, toCents } from '../../../services/format'
import CustomerFields from './CustomerFields'
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
export default function InvoiceDialog({ order, open, onClose }: InvoiceDialogProps) {
  const [kind, setKind] = useState<InvoiceKind>('boleta')
  const [doc, setDoc] = useState<DocumentType>('none')
  const [numero, setNumero] = useState('')
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const queryClient = useQueryClient()
  const emitir = useMutation({
    mutationFn: (payload: IssueInvoiceRequest) => issueInvoice(payload),
    onSuccess: (invoice) => {
      queryClient.setQueryData(orderInvoiceQueryKey(order.id), invoice)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      onClose()
    },
  })
  const total = toCents(order.total)
  const tipo = effectiveDocument(kind, doc, total)

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
        {(['boleta', 'factura'] as const).map((opcion) => (
          <Button key={opcion} type="button" variant={kind === opcion ? 'default' : 'outline'} aria-pressed={kind === opcion} onClick={() => {
            setKind(opcion)
          }}>
            {opcion === 'boleta' ? 'Boleta' : 'Factura'}
          </Button>
        ))}
      </div>
      {kind === 'boleta' ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comprobante-documento">Documento del cliente</Label>
          <NativeSelect id="comprobante-documento" className="w-full" value={tipo} onChange={(e) => {
            setDoc(e.target.value as DocumentType)
          }}>
            {documentOptions(kind, total).map((d) => (
              <NativeSelectOption key={d.value} value={d.value}>{d.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <CustomerFields
        documentType={tipo}
        withAddress={kind === 'factura'}
        values={{ numero, nombre, direccion }}
        onChange={(cambio) => {
          setNumero(cambio.numero)
          setNombre(cambio.nombre)
          setDireccion(cambio.direccion)
        }}
      />
      {emitir.isError ? <FormMessage tone="error">{errorMessage(emitir.error, 'No se pudo emitir el comprobante.')}</FormMessage> : null}
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={emitir.isPending || !customerComplete(tipo, numero, nombre)} onClick={() => {
          emitir.mutate({
            order_id: order.id,
            kind,
            customer_document_type: tipo,
            customer_document_number: numero.trim(),
            customer_name: nombre.trim(),
            customer_address: direccion.trim(),
          })
        }}>
          {emitir.isPending ? 'Emitiendo…' : `Emitir ${kind}`}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
