import type { StockCount } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { BackToLink } from '@/features/inventory/BackToLink'
import { paths } from '@/services/paths'
import { useTimeZone } from '@/store/session'
import { CountActions } from './CountActions'
import { countDescription } from './countSummary'

interface CountHeaderProps {
  readonly count: StockCount | undefined
  /** Cerrar y cancelar, solo en uno en curso y con permiso para contar. */
  readonly canManage: boolean
}

/** El número del conteo, su estado y avance, «Volver» y, en curso, cerrar o cancelar. */
export function CountHeader({ count, canManage }: CountHeaderProps) {
  const timeZone = useTimeZone()
  if (count === undefined) {
    return <PageHeader title="Conteo físico" actions={<BackToLink to={paths.inventory.counts} label="Volver a conteos" />} />
  }
  return (
    <PageHeader
      title={`Conteo #${String(count.number)}`}
      description={countDescription(count, timeZone)}
      actions={
        <>
          <BackToLink to={paths.inventory.counts} label="Volver a conteos" />
          {count.status === 'draft' && canManage ? <CountActions count={count} /> : null}
        </>
      }
    />
  )
}
