import type { OrderStatus } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { STATUS_LABELS, STATUS_TONE } from './orderLabels'

interface OrderStatusBadgeProps {
  readonly status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <StatusBadge label={STATUS_LABELS[status]} tone={STATUS_TONE[status]} />
}
