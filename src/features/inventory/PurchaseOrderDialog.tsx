import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ingredientsQuery } from '@/api/inventory'
import { createPurchaseOrder, purchaseSuggestionsQuery, suppliersQuery } from '@/api/purchasing'
import type { CreatePurchaseOrderRequest } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { formatMoney } from '@/services/format'
import { PurchaseLinesList } from './PurchaseLinesList'
import { emptyLine, type LineDraft, linesForApi, linesFromSuggestions } from './purchaseLines'
import { usePurchasingMutation } from './usePurchasingMutation'

interface PurchaseOrderDialogProps {
  readonly open: boolean
  readonly onClose: () => void
}

/**
 * Armar una orden de compra: proveedor y qué insumos pedir.
 *
 * «Cargar sugerencias» trae lo que se está acabando con la cantidad que
 * alcanza para una semana; después se ajusta a mano lo que haga falta.
 */
export function PurchaseOrderDialog({ open, onClose }: PurchaseOrderDialogProps) {
  const suppliers = useQuery({ ...suppliersQuery, enabled: open })
  const ingredients = useQuery({ ...ingredientsQuery, enabled: open })
  const suggestions = useQuery({ ...purchaseSuggestionsQuery, enabled: open })
  const [supplier, setSupplier] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])
  const close = () => {
    setSupplier('')
    setLines([emptyLine()])
    onClose()
  }
  const create = usePurchasingMutation({
    mutationFn: (payload: CreatePurchaseOrderRequest) => createPurchaseOrder(payload),
    success: (order) => `Orden de compra ${String(order.number)} creada (${formatMoney(order.estimated_total)}).`,
    failure: 'No se pudo crear la orden.',
    onSuccess: close,
  })
  const lists = linesForApi(lines)
  const active = (suppliers.data ?? []).filter((p) => p.is_active)

  return (
    <FormDialog open={open} size="lg" title="Nueva orden de compra" onOpenChange={(abierto) => {
      if (!abierto) {
        close()
      }
    }}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="orden-proveedor">Proveedor</Label>
        <NativeSelect id="orden-proveedor" className="w-full" value={supplier} onChange={(event) => {
          setSupplier(event.target.value)
        }}>
          <NativeSelectOption value="">{active.length === 0 ? 'Da de alta un proveedor primero' : 'Elige el proveedor'}</NativeSelectOption>
          {active.map((p) => (
            <NativeSelectOption key={p.id} value={String(p.id)}>{p.name}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Insumos</span>
        <Button type="button" variant="outline" size="sm" disabled={(suggestions.data ?? []).length === 0} onClick={() => {
          setLines(linesFromSuggestions(suggestions.data ?? []))
        }}>
          <Icon name="buy" size={14} />
          <span>Cargar sugerencias ({(suggestions.data ?? []).length})</span>
        </Button>
      </div>
      <PurchaseLinesList lines={lines} ingredients={ingredients.data ?? []} onChange={setLines} />
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={close}>
          Cancelar
        </Button>
        <Button type="button" disabled={supplier === '' || lists === null || create.isPending} onClick={() => {
          if (lists !== null) {
            create.mutate({ supplier_id: Number(supplier), lines: lists, notes: '' })
          }
        }}>
          {create.isPending ? 'Creando…' : 'Crear orden'}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
