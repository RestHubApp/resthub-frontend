import { useQuery } from '@tanstack/react-query'

import { currentCashQuery } from '@/api/cash'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { errorMessage } from '@/services/apiError'
import { CashCurrentSections } from './CashCurrentSections'
import { CashHistory } from './CashHistory'
import { DiscountLimitForm } from './DiscountLimitForm'
import { useCashRefresh } from './useCashRefresh'

/**
 * La caja del local: abrir el turno, ver cómo va y cerrarlo con el arqueo.
 *
 * El arqueo en curso se actualiza solo: cada cobro de un mesero avisa por el
 * canal de pedidos, y abrir o cerrar la caja, por el de caja.
 */
export function CashView() {
  const cashRegister = useQuery(currentCashQuery)
  const refresh = useCashRefresh()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Caja"
        description="Un turno a la vez: se abre con el efectivo inicial y se cierra contando el cajón."
      />
      {cashRegister.isPending ? <ListSkeleton label="Cargando la caja…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {cashRegister.isError ? <RetryQueryError message={errorMessage(cashRegister.error, 'No se pudo cargar la caja.')} onRetry={() => { void cashRegister.refetch() }} /> : null}
      <CashCurrentSections current={cashRegister.data} onClosed={refresh} />
      {/* Lo de abajo aparece recién con la caja cargada: si no, el turno en
          curso lo empujaba hacia abajo al llegar (Lighthouse medía un CLS de 0,24
          en escritorio y 0,46 en el celular). */}
      {cashRegister.isPending ? null : (
        <>
          <SectionCard title="Descuentos del mesero" collapsible defaultOpen={false}>
            <DiscountLimitForm />
          </SectionCard>
          <SectionCard title="Turnos anteriores" collapsible>
            <CashHistory />
          </SectionCard>
        </>
      )}
    </div>
  )
}
