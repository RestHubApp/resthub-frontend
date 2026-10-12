import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
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
      <FormFooter
        mutation={{ isPending: draft.isCreating }}
        onCancel={draft.close}
        submit={{ label: 'Crear orden', pendingLabel: 'Creando…', onClick: draft.submit, isDisabled: !draft.canCreate }}
      />
    </FormDialog>
  )
}
