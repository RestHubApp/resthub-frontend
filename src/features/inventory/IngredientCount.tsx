interface IngredientCountProps {
  readonly shown: number
  readonly total: number
  /** Cuántos están bajo su mínimo, negativos incluidos. */
  readonly lowCount: number
}

/** Cuántos insumos se ven y cuántos hay que reponer; se anuncia al filtrar. */
export function IngredientCount({ shown, total, lowCount }: IngredientCountProps) {
  return (
    <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
      <span>{shown === total ? `${String(total)} insumos` : `${String(shown)} de ${String(total)} insumos`}</span>
      {lowCount === 0 ? null : <span>{`, ${String(lowCount)} por reponer`}</span>}
    </p>
  )
}
