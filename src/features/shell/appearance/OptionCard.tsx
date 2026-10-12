import type { ReactNode } from 'react'

import { ShellIcon } from '@/features/shell/ShellIcon'

interface OptionCardProps {
  /** El grupo de opciones: las que comparten `name` se eligen de una en una. */
  readonly name: string
  readonly value: string
  readonly label: string
  readonly description?: string | undefined
  readonly isChecked: boolean
  readonly onSelect: () => void
  /** La muestra de la opción (decorativa: el texto ya la describe). */
  readonly children?: ReactNode
}

/**
 * Una opción que se elige tocando su tarjeta, con una muestra de cómo se ve.
 *
 * Es un botón de opción nativo (`radio`): con el teclado se mueve con las
 * flechas y el lector de pantalla anuncia «3 de 7». La elegida se marca con un
 * borde, un anillo y una palomita, no solo con el color.
 */
export function OptionCard({ name, value, label, description, isChecked, onSelect, children }: OptionCardProps) {
  return (
    <label className="relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-4 has-focus-visible:ring-ring/60">
      <input type="radio" className="peer sr-only" name={name} value={value} checked={isChecked} onChange={onSelect} />
      {children}
      <span className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        {isChecked ? <ShellIcon name="correct" size={18} className="shrink-0 text-primary" /> : null}
      </span>
      {description === undefined ? null : <span className="text-sm text-muted-foreground">{description}</span>}
    </label>
  )
}
