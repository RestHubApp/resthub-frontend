import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ingredientsQuery } from '../../api/inventory'
import { createPurchaseOrder, purchaseSuggestionsQuery, suppliersQuery } from '../../api/purchasing'
import type { CreatePurchaseOrderRequest } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormDialog from '../../components/FormDialog'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import { formatMoney } from '../../services/format'
import PurchaseLinesList from './PurchaseLinesList'
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
export default function PurchaseOrderDialog({ open, onClose }: PurchaseOrderDialogProps) {
  const proveedores = useQuery({ ...suppliersQuery, enabled: open })
  const insumos = useQuery({ ...ingredientsQuery, enabled: open })
  const sugerencias = useQuery({ ...purchaseSuggestionsQuery, enabled: open })
  const [proveedor, setProveedor] = useState('')
  const [lineas, setLineas] = useState<LineDraft[]>([emptyLine()])
  const cerrar = () => {
    setProveedor('')
    setLineas([emptyLine()])
    onClose()
  }
  const crear = usePurchasingMutation({
    mutationFn: (payload: CreatePurchaseOrderRequest) => createPurchaseOrder(payload),
    success: (orden) => `Orden de compra ${String(orden.number)} creada (${formatMoney(orden.estimated_total)}).`,
    failure: 'No se pudo crear la orden.',
    onSuccess: cerrar,
  })
  const listas = linesForApi(lineas)
  const activos = (proveedores.data ?? []).filter((p) => p.is_active)

  return (
    <FormDialog open={open} size="lg" title="Nueva orden de compra" onOpenChange={(abierto) => {
      if (!abierto) {
        cerrar()
      }
    }}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="orden-proveedor">Proveedor</Label>
        <NativeSelect id="orden-proveedor" className="w-full" value={proveedor} onChange={(evento) => {
          setProveedor(evento.target.value)
        }}>
          <NativeSelectOption value="">{activos.length === 0 ? 'Da de alta un proveedor primero' : 'Elige el proveedor'}</NativeSelectOption>
          {activos.map((p) => (
            <NativeSelectOption key={p.id} value={String(p.id)}>{p.name}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Insumos</span>
        <Button type="button" variant="outline" size="sm" disabled={(sugerencias.data ?? []).length === 0} onClick={() => {
          setLineas(linesFromSuggestions(sugerencias.data ?? []))
        }}>
          <Icon name="comprar" size={14} />
          <span>Cargar sugerencias ({(sugerencias.data ?? []).length})</span>
        </Button>
      </div>
      <PurchaseLinesList lines={lineas} ingredients={insumos.data ?? []} onChange={setLineas} />
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={cerrar}>
          Cancelar
        </Button>
        <Button type="button" disabled={proveedor === '' || listas === null || crear.isPending} onClick={() => {
          if (listas !== null) {
            crear.mutate({ supplier_id: Number(proveedor), lines: listas, notes: '' })
          }
        }}>
          {crear.isPending ? 'Creando…' : 'Crear orden'}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
