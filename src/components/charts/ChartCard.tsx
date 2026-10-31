import { type ReactNode, useState } from 'react'

import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'

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
export function ChartCard({
  title,
  description,
  chart,
  table,
  refreshing = false,
  actions,
}: ChartCardProps) {
  const [isTableView, setIsTableView] = useState(false)

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
            aria-pressed={isTableView}
            onClick={() => {
              setIsTableView((value) => !value)
            }}
          >
            <Icon glyph={isTableView ? icons.chart : icons.grid} size={14} />
            <span>{isTableView ? 'Ver gráfico' : 'Ver tabla'}</span>
          </Button>
        </>
      }
    >
      <div
        aria-busy={refreshing}
        className={`transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}
      >
        {isTableView ? table : chart}
      </div>
    </SectionCard>
  )
}
