import type { OrderStatus } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { STATUS_TONE } from './orderLabels'

interface OrderStatusBadgeProps {
  readonly status: OrderStatus
  readonly label: string
}

export default function OrderStatusBadge({ status, label }: OrderStatusBadgeProps) {
  return <StatusBadge label={label} tone={STATUS_TONE[status]} />
}
