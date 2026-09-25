import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { fetchLowStock, insightsQueryKey } from '../../api/insights'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import LowStockRow from './LowStockRow'
import ReportState from './ReportState'

/** Los insumos que ya están por debajo de su mínimo. No depende del rango: es el stock de hoy. */
export default function LowStockSection() {
  const insumos = useQuery({ queryKey: [...insightsQueryKey, 'low-stock'], queryFn: fetchLowStock })

  return (
    <SectionCard
      title="Insumos bajo mínimo"
      description="El stock de ahora, sin importar el rango elegido."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/panel/reposicion">
            <Icon name="comprar" size={14} />
            <span>Ver reposición sugerida</span>
          </Link>
        </Button>
      }
    >
      <ReportState data={insumos.data} error={insumos.error} errorText="No se pudo cargar el stock.">
        {(items) =>
          items.length === 0 ? (
            <EmptyState title="Ningún insumo está bajo su mínimo." />
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y p-0">
              {items.map((item) => (
                <LowStockRow key={item.ingredient_id} item={item} />
              ))}
            </ul>
          )
        }
      </ReportState>
    </SectionCard>
  )
}
