interface UrgencyMeterProps {
  /** De 0 (ninguna) a 3 (crítica). */
  readonly urgency: number
  readonly label: string
}

const STEPS = 3

/** La urgencia en tres marcas y escrita: el texto la dice, las marcas la dejan comparar de un vistazo. */
export default function UrgencyMeter({ urgency, label }: UrgencyMeterProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: STEPS }, (_, indice) => (
          <span
            key={indice}
            className={`h-2 w-3 rounded-[2px] ${indice < urgency ? 'bg-foreground' : 'bg-muted-foreground/25'}`}
          />
        ))}
      </span>
      {label}
    </span>
  )
}
