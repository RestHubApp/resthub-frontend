import { Link } from 'react-router'

import type { StockCountSummary } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { progressText } from './countSummary'

interface CurrentCountProps {
  /** El conteo en curso, si hay uno (solo puede haber uno por local). */
  readonly draft: StockCountSummary | undefined
  readonly canManage: boolean
  readonly onStart: () => void
}

/** El conteo en curso con su avance, o el botón para empezar uno. */
export function CurrentCount({ draft, canManage, onStart }: CurrentCountProps) {
  if (draft !== undefined) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-secondary/40 p-4">
        <div className="flex flex-col">
          <p className="m-0 font-semibold">Conteo #{draft.number} en curso</p>
          <p className="m-0 text-sm text-muted-foreground">{progressText(draft)}</p>
        </div>
        <Link to={paths.inventory.count(draft.id)} className={buttonVariants()}>
          <Icon name="count" size={16} />
          <span>{canManage ? 'Seguir contando' : 'Ver avance'}</span>
        </Link>
      </div>
    )
  }
  if (!canManage) {
    return <p className="m-0 text-sm text-muted-foreground">No hay ningún conteo en curso.</p>
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <p className="m-0 max-w-prose text-sm text-muted-foreground">
        Cuenta lo que hay en el local y compáralo con el sistema. Al cerrar, cada diferencia ajusta el stock y ves
        cuánto faltó o sobró, en soles.
      </p>
      <Button type="button" onClick={onStart}>
        <Icon name="count" size={16} />
        <span>Iniciar conteo</span>
      </Button>
    </div>
  )
}
