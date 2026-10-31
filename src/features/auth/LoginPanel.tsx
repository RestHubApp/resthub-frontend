import { Icon, type IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import { LoginPattern } from './LoginPattern'

interface PanelPoint {
  readonly icon: IconGlyph
  readonly text: string
}

const POINTS: readonly PanelPoint[] = [
  { icon: icons.order, text: 'Toma los pedidos desde el celular, mesa por mesa o para llevar.' },
  { icon: icons.board, text: 'La cocina ve qué preparar y la caja sabe qué cobrar.' },
  { icon: icons.indicators, text: 'Ventas, inventario y lo que más se pide, al día. El equipo de RestHub administra el sistema desde aquí.' },
]

/**
 * El panel de marca del acceso en pantallas anchas: a la altura completa, con
 * el color de la marca y lo que se hace con la cuenta. Es de apoyo; el
 * formulario es lo principal, por eso va después y no lleva ningún botón.
 */
export function LoginPanel() {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-center">
      <LoginPattern />
      <div className="relative flex max-w-md flex-col gap-8 p-12 xl:p-16">
        <h2 className="m-0 font-heading text-3xl leading-tight font-bold text-balance">
          El servicio del restaurante, en un solo lugar
        </h2>
        <ul className="m-0 flex list-none flex-col gap-5 p-0" role="list">
          {POINTS.map((point) => (
            <li key={point.text} className="flex items-start gap-3 text-base leading-relaxed">
              <Icon glyph={point.icon} size={20} className="mt-1 shrink-0" />
              <span>{point.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
