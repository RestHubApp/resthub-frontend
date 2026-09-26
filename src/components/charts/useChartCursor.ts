import { type KeyboardEvent, useState } from 'react'

type Move = (actual: number, total: number, rowStep: number) => number

const MOVES: Partial<Record<string, Move>> = {
  ArrowLeft: (actual) => actual - 1,
  ArrowRight: (actual) => actual + 1,
  ArrowUp: (actual, _, rowStep) => actual - rowStep,
  ArrowDown: (actual, _, rowStep) => actual + rowStep,
  Home: () => 0,
  End: (_, total) => total - 1,
}

/**
 * El punto señalado de un gráfico, con el mouse o con el teclado.
 *
 * Con el foco en el gráfico, las flechas recorren los puntos y muestran la
 * misma lectura que el mouse. `step` permite saltar de a una fila en una grilla.
 */
export function useChartCursor(total: number, rowStep = 1) {
  const [active, setActive] = useState<number | null>(null)

  const onKeyDown = (event: KeyboardEvent) => {
    const mover = MOVES[event.key]
    if (mover === undefined || total === 0) {
      return
    }
    event.preventDefault()
    const siguiente = mover(active ?? total - 1, total, rowStep)
    setActive(Math.min(total - 1, Math.max(0, siguiente)))
  }

  return {
    active,
    setActive,
    onKeyDown,
    onFocus: () => {
      setActive((valor) => valor ?? total - 1)
    },
    onBlur: () => {
      setActive(null)
    },
  }
}
