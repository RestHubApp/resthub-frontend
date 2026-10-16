import { useState } from 'react'

import { cancelStockCount, closeStockCount } from '@/api/stockCounts'
import type { StockCount } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { InventoryFailure } from '@/features/inventory/InventoryFailure'
import { closeWarning } from './countSummary'
import { useCloseCount } from './useCloseCount'
import { useStockCountChange } from './useStockCountChange'

/**
 * Cerrar o cancelar el conteo en curso, siempre con confirmación.
 *
 * Al cerrar, lo contado ajusta el stock y lo que quedó sin contar no se toca;
 * la confirmación dice cuántos son. Sin nada contado no se puede cerrar: se
 * cancela.
 */
export function CountActions({ count }: { readonly count: StockCount }) {
  const [asked, setAsked] = useState<'close' | 'cancel' | null>(null)
  const close = useCloseCount(count.id, () => closeStockCount(count.id))
  const cancel = useStockCountChange(count.id, {
    send: () => cancelStockCount(count.id),
    success: (cancelled) => `Conteo #${String(cancelled.number)} cancelado. El stock no cambió.`,
  })
  const isPending = close.isPending || cancel.isPending
  const ask = (which: 'close' | 'cancel' | null) => () => {
    setAsked(which)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={ask('cancel')}>
          <Icon name="cancel" size={16} />
          <span>Cancelar conteo</span>
        </Button>
        <Button type="button" disabled={isPending || count.counted_lines === 0} onClick={ask('close')}>
          <Icon name="confirm" size={16} />
          <span>{close.isPending ? 'Cerrando…' : 'Cerrar conteo'}</span>
        </Button>
      </div>
      <InventoryFailure mutation={close} fallback="No se pudo cerrar el conteo." />
      <InventoryFailure mutation={cancel} fallback="No se pudo cancelar el conteo." />
      <ConfirmDialog
        open={asked === 'close'}
        onOpenChange={(isOpen) => { setAsked(isOpen ? 'close' : null) }}
        title={`¿Cerrar el conteo #${String(count.number)}?`}
        description={closeWarning(count)}
        confirmLabel="Cerrar y ajustar"
        confirmVariant="default"
        onConfirm={() => { close.mutate() }}
      />
      <ConfirmDialog
        open={asked === 'cancel'}
        onOpenChange={(isOpen) => { setAsked(isOpen ? 'cancel' : null) }}
        title={`¿Cancelar el conteo #${String(count.number)}?`}
        description="Lo contado se descarta y el stock no cambia."
        confirmLabel="Cancelar conteo"
        onConfirm={() => { cancel.mutate() }}
      />
    </div>
  )
}
