import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { lowStockQuery } from '@/api/insights'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { LowStockRow } from './LowStockRow'
import { ReportState } from './ReportState'

// Un resumen, no la lista completa: la compra y el detalle viven en la reposición.
const MAX_ROWS = 5

/** Los insumos que ya están por debajo de su mínimo. No depende del rango: es el stock de hoy. */
export function LowStockSection() {
  const ingredients = useQuery(lowStockQuery)

  return (
    <SectionCard
      title="Insumos bajo mínimo"
      description="El stock de ahora, sin importar el rango elegido."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to={paths.insights.restock}>
            <Icon glyph={icons.buy} size={14} />
            <span>Ver reposición sugerida</span>
          </Link>
        </Button>
      }
    >
      <ReportState data={ingredients.data} error={ingredients.error} errorText="No se pudo cargar el stock." loadingLabel="Cargando el stock…">
        {(items) =>
          items.length === 0 ? (
            <EmptyState title="Ningún insumo está bajo su mínimo." />
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col divide-y p-0">
                {items.slice(0, MAX_ROWS).map((item) => (
                  <LowStockRow key={item.ingredient_id} item={item} />
                ))}
              </ul>
              {items.length > MAX_ROWS ? (
                <p className="m-0 mt-3 text-sm text-muted-foreground">
                  y {items.length - MAX_ROWS} más en la reposición sugerida.
                </p>
              ) : null}
            </>
          )
        }
      </ReportState>
    </SectionCard>
  )
}
