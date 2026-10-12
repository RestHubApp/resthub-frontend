import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { PanelHeader } from './PanelHeader'
import { ReportState } from './ReportState'
import { RestockReportContent } from './RestockReportContent'
import { RestockUpdateStatus } from './RestockUpdateStatus'
import { useRestock } from './useRestock'

/** Reposición inteligente: qué comprar y cuándo, según el consumo y las mermas. */
export function RestockView() {
  const { recommendation, update } = useRestock()

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        description="Qué insumos comprar y cuándo, según el stock, el consumo de las últimas semanas y las mermas."
        actions={
          <Button type="button" disabled={update.isPending} onClick={() => { update.mutate() }}>
            <Icon name="update" size={16} className={update.isPending ? 'animate-spin' : undefined} />
            <span>{update.isPending ? 'Actualizando…' : 'Actualizar recomendaciones'}</span>
          </Button>
        }
      />
      <RestockUpdateStatus isPending={update.isPending} isError={update.isError} error={update.error} />
      <ReportState data={recommendation.data} error={recommendation.error} errorText="No se pudo cargar la reposición.">
        {(report) => <RestockReportContent report={report} isUpdating={update.isPending} />}
      </ReportState>
    </div>
  )
}
