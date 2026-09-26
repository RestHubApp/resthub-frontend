import type { PlatformSandbox } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import { formatDateTime } from '../../services/format'
import { PLATFORM_TIME_ZONE } from './platformTime'

const TERMINO = 'm-0 text-sm text-muted-foreground'
const DATO = 'm-0 text-base font-medium break-words'

interface SandboxSummaryProps {
  readonly sandbox: PlatformSandbox
}

/** El local de muestra vigente: cuándo se creó y con qué cuentas se entra. */
export default function SandboxSummary({ sandbox }: SandboxSummaryProps) {
  const local = sandbox.restaurant
  if (local === null) {
    return (
      <EmptyState
        title="Todavía no hay local de muestra."
        description="Se crea solo al abrir la primera vista previa, o con «Reiniciar local de muestra»."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="m-0 grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className={TERMINO}>Nombre</dt>
          <dd className={DATO}>{local.name}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={TERMINO}>Identificador</dt>
          <dd className={DATO}>
            <code className="text-sm break-all">{local.slug}</code>
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={TERMINO}>Creado</dt>
          <dd className={DATO}>{formatDateTime(local.created_at, PLATFORM_TIME_ZONE)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-base font-semibold">Cuentas de muestra</h3>
        {sandbox.accounts.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">No tiene cuentas activas. Reinícialo para recuperarlas.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y p-0">
            {sandbox.accounts.map((cuenta) => (
              <li key={`${cuenta.kind}-${cuenta.full_name}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium break-words">{cuenta.full_name}</span>
                <span className="text-sm text-muted-foreground">{cuenta.role_label}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="m-0 text-sm text-muted-foreground">
          No tienen contraseña: solo se entra a ellas con «Ver como…».
        </p>
      </div>
    </div>
  )
}
