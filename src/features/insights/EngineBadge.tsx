import type { AiDecision, DecisionEngine } from '../../api/types'
import Icon from '../../components/Icon'

interface EngineBadgeProps {
  readonly engine: DecisionEngine
  /** Por qué no decidió Jev. */
  readonly fallbackReason?: AiDecision['fallback_reason']
  /** La explicación larga del servidor, para el texto emergente. */
  readonly fallbackLabel?: string | null
}

type FallbackReason = NonNullable<AiDecision['fallback_reason']>

const FALLBACKS: Record<FallbackReason, string> = {
  not_configured: 'sin configurar',
  unavailable: 'no disponible',
  low_confidence: 'confianza baja',
}

const ENGINES: Record<DecisionEngine, { readonly name: string; readonly title: string }> = {
  jev: { name: 'Jev', title: 'Decidió Jev, el modelo de decisiones de TypeSafe AI' },
  rules: { name: 'Reglas', title: 'Decidieron las reglas fijas del sistema' },
}

/** Qué motor tomó la decisión y, si fueron las reglas, por qué. */
export default function EngineBadge({ engine, fallbackReason, fallbackLabel }: EngineBadgeProps) {
  const motor = ENGINES[engine]
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span
        title={motor.title}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-foreground"
      >
        <Icon name={engine === 'jev' ? 'ia' : 'reglas'} size={14} />
        {motor.name}
      </span>
      {fallbackReason === null || fallbackReason === undefined ? null : (
        <span className="text-muted-foreground" title={fallbackLabel ?? undefined}>
          Respaldo: {FALLBACKS[fallbackReason]}
        </span>
      )}
    </span>
  )
}
