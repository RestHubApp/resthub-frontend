import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import { PurchaseLinesList } from './PurchaseLinesList'
import { SuggestionsBar } from './SuggestionsBar'
import { SupplierSelect } from './SupplierSelect'
import { usePurchaseOrderDraft } from './usePurchaseOrderDraft'

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
  const draft = usePurchaseOrderDraft(open, onClose)

  return (
    <FormDialog
      open={open}
      size="lg"
      title="Nueva orden de compra"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          draft.close()
        }
      }}
    >
      <SupplierSelect suppliers={draft.suppliers} value={draft.supplier} onChange={draft.setSupplier} />
      <SuggestionsBar count={draft.suggestionCount} onLoad={draft.loadSuggestions} />
      <PurchaseLinesList lines={draft.lines} ingredients={draft.ingredients} onChange={draft.setLines} />
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={draft.close}>
          Cancelar
        </Button>
        <Button type="button" disabled={!draft.canCreate} onClick={draft.submit}>
          {draft.isCreating ? 'Creando…' : 'Crear orden'}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
