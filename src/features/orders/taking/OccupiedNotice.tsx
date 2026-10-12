import { Link } from 'react-router'

import { FormMessage } from '@/components/FormMessage'
import { paths } from '@/services/paths'

interface OccupiedNoticeProps {
  readonly orderId: number
  readonly number: number
}

/** La mesa se ocupo mientras se elegian platos: otro mesero se adelanto. */
export function OccupiedNotice({ orderId, number }: OccupiedNoticeProps) {
  return (
    <FormMessage tone="error">
      Esta mesa ya tiene el pedido #{number}.{' '}
      <Link to={paths.orders.detail(orderId)} className="font-semibold underline">
        Ver el pedido
      </Link>
    </FormMessage>
  )
}
