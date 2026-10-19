import { useState } from 'react'

import type { WasteApproval } from '@/api/types'
import { approveWaste } from '@/api/wasteApprovals'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { InventoryFailure } from '@/features/inventory/InventoryFailure'
import { formatMoney, formatQuantity } from '@/services/format'
import { useWasteDecision } from './useWasteDecision'

interface WasteApprovalActionsProps {
  readonly approval: WasteApproval
  readonly onReject: (approval: WasteApproval) => void
}

/** Aprobar (con confirmación: baja el stock) o rechazar con motivo. */
export function WasteApprovalActions({ approval, onReject }: WasteApprovalActionsProps) {
  const [isAsking, setIsAsking] = useState(false)
  const approve = useWasteDecision({
    send: () => approveWaste(approval.id),
    success: (decided) => `Merma de ${decided.ingredient_name} aprobada: el stock bajó.`,
  })
  const quantity = formatQuantity(approval.quantity, approval.unit)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="flex-1 sm:flex-none"
          disabled={approve.isPending}
          onClick={() => {
            setIsAsking(true)
          }}
        >
          <Icon name="confirm" size={16} />
          <span>{approve.isPending ? 'Aprobando…' : 'Aprobar'}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-none"
          disabled={approve.isPending}
          onClick={() => {
            onReject(approval)
          }}
        >
          <Icon name="cancel" size={16} />
          <span>Rechazar</span>
        </Button>
      </div>
      <InventoryFailure mutation={approve} fallback="No se pudo aprobar la merma." />
      <ConfirmDialog
        open={isAsking}
        onOpenChange={setIsAsking}
        title={`¿Aprobar la merma de ${approval.ingredient_name}?`}
        description={`Se descuentan ${quantity} del stock. El valor se toma con el costo de hoy (al registrarla era ${formatMoney(approval.value)}).`}
        confirmLabel="Aprobar merma"
        confirmVariant="default"
        onConfirm={() => {
          approve.mutate()
        }}
      />
    </div>
  )
}
