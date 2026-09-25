import { type ReactNode, useState } from 'react'

import Icon from '../../../components/Icon'
import SectionCard from '../../../components/SectionCard'
import { Button } from '../../../components/ui/button'

interface ChartCardProps {
  readonly title: string
  readonly description?: ReactNode
  readonly chart: ReactNode
  /** La misma información en una tabla: el gemelo accesible de cada gráfico. */
  readonly table: ReactNode
  /** Mientras llega el rango nuevo, el gráfico anterior se queda atenuado. */
  readonly refreshing?: boolean
  /** Acciones propias de la sección, además del cambio a tabla. */
  readonly actions?: ReactNode
}

/**
 * Un gráfico del panel con su vista de tabla.
 *
 * El cambio a tabla es para quien no ve el color o usa un lector de pantalla,
 * y también para quien quiere copiar los números.
 */
export default function ChartCard({
  title,
  description,
  chart,
  table,
  refreshing = false,
  actions,
}: ChartCardProps) {
  const [comoTabla, setComoTabla] = useState(false)

  return (
    <SectionCard
      title={title}
      description={description}
      actions={
        <>
          {actions}
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={comoTabla}
            onClick={() => {
              setComoTabla((valor) => !valor)
            }}
          >
            <Icon name={comoTabla ? 'grafico' : 'tabla'} size={14} />
            <span>{comoTabla ? 'Ver gráfico' : 'Ver tabla'}</span>
          </Button>
        </>
      }
    >
      <div
        aria-busy={refreshing}
        className={`transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}
      >
        {comoTabla ? table : chart}
      </div>
    </SectionCard>
  )
}
