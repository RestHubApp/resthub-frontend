import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Checkbox } from '@/components/ui/checkbox'

interface ConsentCheckProps {
  readonly id: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  /** Lo que se acepta, en una frase. */
  readonly children: ReactNode
  /** A dónde lleva el enlace a la sección que se acepta. */
  readonly readTo: string
  readonly readLabel: string
}

/**
 * Una casilla de consentimiento (Ley N.º 29733), sin marcar por omisión, con el
 * enlace a la sección que acepta. El enlace queda fuera de la etiqueta: un enlace
 * dentro de ella marcaría la casilla al abrirlo.
 */
export function ConsentCheck({ id, checked, onChange, children, readTo, readLabel }: ConsentCheckProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-input p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          className="mt-1"
          checked={checked}
          onCheckedChange={(value) => {
            onChange(value === true)
          }}
        />
        <label htmlFor={id} className="min-h-6 cursor-pointer text-sm leading-relaxed">
          {children}
        </label>
      </div>
      <Link to={readTo} target="_blank" className="ml-7 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
        {readLabel}
      </Link>
    </div>
  )
}
