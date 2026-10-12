/** Como se ve y que hace el boton "menos" del contador de cantidad. */
export interface MinusState {
  /** Con la cantidad en 1, "−" quita el plato. */
  readonly shouldRemoveDish: boolean
  readonly isDisabled: boolean
}

/** Calcula el estado del boton "menos": quita el plato si se puede, o se bloquea en 1. */
export function minusState(quantity: number, canRemove: boolean, isDisabled: boolean): MinusState {
  const isAtFloor = quantity <= 1
  return { shouldRemoveDish: isAtFloor && canRemove, isDisabled: isDisabled || (isAtFloor && !canRemove) }
}
