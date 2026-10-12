import type { OrderStatus } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { STATUS_LABELS, STATUS_TONE } from './orderLabels'

interface OrderStatusBadgeProps {
  readonly status: OrderStatus
  readonly className?: string | undefined
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return <StatusBadge label={STATUS_LABELS[status]} tone={STATUS_TONE[status]} className={className} />
}
