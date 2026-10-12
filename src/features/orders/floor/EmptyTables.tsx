import { Link } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'

/** El salón sin mesas activas; quien administra mesas ve el atajo para crearlas. */
export function EmptyTables() {
  const canManage = useCan(PERMISSION.tablesManage)

  return (
    <EmptyState title="No hay mesas activas" description="Los pedidos para llevar siguen funcionando.">
      {canManage ? (
        <Button asChild variant="outline">
          <Link to={paths.tables}>Crear mesas</Link>
        </Button>
      ) : null}
    </EmptyState>
  )
}
