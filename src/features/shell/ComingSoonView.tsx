import { useLocation } from 'react-router'

import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { entryFor } from './navigation'

/**
 * El lugar de una pantalla que todavia no existe.
 *
 * Toma el titulo y la descripcion de la entrada del menu, asi que la ruta ya
 * queda en su sitio y con su permiso, y reemplazarla es cambiar un componente.
 */
export default function ComingSoonView() {
  const entry = entryFor(useLocation().pathname)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={entry?.label ?? 'Próximamente'} description={entry?.description} />
      <EmptyState
        title="Próximamente"
        description="Esta pantalla se está construyendo. Mientras tanto, el resto de RestHub funciona."
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon name={entry?.icon ?? 'pronto'} size={24} />
        </span>
      </EmptyState>
    </div>
  )
}
