import type { AiDecision } from '../../api/types'

interface AiDecisionDetailProps {
  readonly decision: AiDecision
}

const JSON_BLOCK =
  'm-0 max-h-80 overflow-auto rounded-lg bg-card p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ring-1 ring-foreground/10'

/** Lo que recibió el motor y lo que respondió, tal cual se guardó. */
export default function AiDecisionDetail({ decision }: AiDecisionDetailProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-sm font-semibold">Estado de entrada</h3>
        <pre className={JSON_BLOCK}>{JSON.stringify(decision.input_state, null, 2)}</pre>
      </section>
      <section className="flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-sm font-semibold">Salida</h3>
        <pre className={JSON_BLOCK}>{JSON.stringify(decision.output, null, 2)}</pre>
        {decision.model === null ? null : (
          <p className="m-0 text-xs text-muted-foreground">Modelo: {decision.model}</p>
        )}
      </section>
    </div>
  )
}
