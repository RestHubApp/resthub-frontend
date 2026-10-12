import type { Customer } from '@/api/types'
import { Sheet } from '@/components/ui/sheet'
import { CustomerSheetContent } from './CustomerSheetContent'

interface CustomerSheetProps {
  readonly customerId: number | null
  readonly canEdit: boolean
  readonly onEdit: (customer: Customer) => void
  readonly onClose: () => void
}

/** Un cliente: sus datos, cuánto viene y gasta, y sus últimos pedidos. */
export function CustomerSheet({ customerId, canEdit, onEdit, onClose }: CustomerSheetProps) {
  return (
    <Sheet open={customerId !== null} onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      {customerId === null ? null : (
        <CustomerSheetContent customerId={customerId} canEdit={canEdit} onEdit={onEdit} onClose={onClose} />
      )}
    </Sheet>
  )
}
