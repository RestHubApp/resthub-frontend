import { useQuery, useQueryClient } from '@tanstack/react-query'

import { cashQueryKey, currentCashQuery } from '../../api/cash'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { useServerEvent } from '../../hooks/useServerEvent'
import { errorMessage } from '../../services/api'
import { formatDateTime, formatMoney } from '../../services/format'
import { useTimeZone } from '../../store/session'
import CashHistory from './CashHistory'
import CashSummaryView from './CashSummaryView'
import CloseCashForm from './CloseCashForm'
import DiscountLimitForm from './DiscountLimitForm'
import OpenCashForm from './OpenCashForm'

/**
 * La caja del local: abrir el turno, ver cómo va y cerrarlo con el arqueo.
 *
 * El arqueo en curso se actualiza solo: cada cobro de un mesero avisa por el
 * canal de pedidos, y abrir o cerrar la caja, por el de caja.
 */
export default function CashView() {
  const timeZone = useTimeZone()
  const queryClient = useQueryClient()
  const caja = useQuery(currentCashQuery)
  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: cashQueryKey })
  }
  useServerEvent('orders', refrescar)
  useServerEvent('cash', refrescar)
  const turno = caja.data?.session ?? null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Caja"
        description="Un turno a la vez: se abre con el efectivo inicial y se cierra contando el cajón."
      />
      {caja.isPending ? <ListSkeleton label="Cargando la caja…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {caja.isError ? <FormMessage tone="error">{errorMessage(caja.error, 'No se pudo cargar la caja.')}</FormMessage> : null}
      {caja.data?.is_open === false ? (
        <SectionCard title="Abrir caja" description="Sin caja abierta, nadie puede cobrar.">
          <OpenCashForm />
        </SectionCard>
      ) : null}
      {turno?.summary ? (
        <>
          <SectionCard
            title="Turno en curso"
            description={`Abrió ${turno.opened_by_name} el ${formatDateTime(turno.opened_at, timeZone)} con ${formatMoney(turno.opening_amount)}`}
          >
            <CashSummaryView session={turno} summary={turno.summary} />
          </SectionCard>
          <SectionCard title="Cerrar caja" description="Cuenta el efectivo del cajón, propinas en efectivo incluidas.">
            <CloseCashForm session={turno} onClosed={refrescar} />
          </SectionCard>
        </>
      ) : null}
      <SectionCard title="Descuentos del mesero" collapsible defaultOpen={false}>
        <DiscountLimitForm />
      </SectionCard>
      <SectionCard title="Turnos anteriores" collapsible>
        <CashHistory />
      </SectionCard>
    </div>
  )
}
