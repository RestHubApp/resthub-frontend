import { useState } from 'react'

/**
 * Lo que se está escribiendo en un filtro que se aplica al enviar.
 *
 * Si el valor aplicado cambia desde afuera (un enlace «Ver las peticiones
 * de…», «Quitar filtros»), el borrador lo sigue; mientras tanto, lo escrito
 * no se pierde por una relectura. Se ajusta al dibujar y no en un efecto,
 * como recomienda React, para no mostrar un cuadro con el valor viejo.
 */
export function useDraft(applied: string): [string, (value: string) => void] {
  const [draft, setDraft] = useState(applied)
  const [previous, setPrevious] = useState(applied)
  if (applied !== previous) {
    setPrevious(applied)
    setDraft(applied)
  }
  return [draft, setDraft]
}
