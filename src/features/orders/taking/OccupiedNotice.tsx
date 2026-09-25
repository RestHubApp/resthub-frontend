import { Link } from 'react-router'

import FormMessage from '../../../components/FormMessage'

interface OccupiedNoticeProps {
  readonly orderId: number
  readonly number: number
}

/** La mesa se ocupo mientras se elegian platos: otro mesero se adelanto. */
export default function OccupiedNotice({ orderId, number }: OccupiedNoticeProps) {
  return (
    <FormMessage tone="error">
      Esta mesa ya tiene el pedido #{number}.{' '}
      <Link to={`/pedidos/${String(orderId)}`} className="font-semibold underline">
        Ver el pedido
      </Link>
    </FormMessage>
  )
}
