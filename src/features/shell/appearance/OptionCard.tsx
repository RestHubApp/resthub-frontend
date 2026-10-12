import { cn } from 'cn'
import type { ReactNode } from 'react'

import { ShellIcon } from '@/features/shell/ShellIcon'

interface OptionCardProps {
  /** El grupo de opciones: las que comparten `name` se eligen de una en una. */
  readonly name: string
  readonly value: string
  readonly label: string
  /** Se lee siempre con el lector de pantalla, pero solo se ve en la opción elegida. */
  readonly description?: string | undefined
  readonly isChecked: boolean
  readonly onSelect: () => void
  /** La muestra de la opción (decorativa: el texto ya la describe). */
  readonly children?: ReactNode
  /** `inline`: la muestra a la izquierda y el texto a la derecha, para listas cortas en el celular. */
  readonly layout?: 'stacked' | 'inline'
}

/**
 * Una opción que se elige tocando su tarjeta, con una muestra pequeña de cómo se ve.
 *
 * Es un botón de opción nativo (`radio`): con el teclado se mueve con las
 * flechas y el lector de pantalla anuncia «3 de 4». La elegida se marca con un
 * borde, un anillo y una palomita, no solo con el color (y con un contorno en
 * los colores forzados de Windows, ver `index.css`). Su nombre es la etiqueta; la
 * descripción es el detalle que se anuncia después.
 */
export function OptionCard({ name, value, label, description, isChecked, onSelect, children, layout = 'stacked' }: OptionCardProps) {
  const labelId = `${name}-${value}-label`
  const detailId = `${name}-${value}-detail`
  return (
    <label className={cn('relative flex cursor-pointer gap-1.5 rounded-xl border bg-card p-2.5 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-4 has-focus-visible:ring-ring/60', layout === 'inline' ? 'flex-row items-center gap-3' : 'flex-col')}>
      <input
        type="radio"
        className="peer sr-only"
        name={name}
        value={value}
        checked={isChecked}
        aria-labelledby={labelId}
        aria-describedby={description === undefined ? undefined : detailId}
        onChange={onSelect}
      />
      {children}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-2">
          <span id={labelId} className="text-sm font-medium text-foreground">
            {label}
          </span>
          {isChecked ? <ShellIcon name="correct" size={16} className="shrink-0 text-primary" /> : null}
        </span>
        {description === undefined ? null : (
          <span id={detailId} className={isChecked ? 'text-xs text-muted-foreground' : 'sr-only'}>
            {description}
          </span>
        )}
      </span>
    </label>
  )
}
