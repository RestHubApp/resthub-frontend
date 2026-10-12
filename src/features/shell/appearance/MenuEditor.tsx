import { BOTTOM_BAR_SLOTS } from '@/services/appearanceRules'
import { BottomBarPreview } from './BottomBarPreview'
import { MenuGroupList } from './MenuGroupList'
import { useMenuEditing } from './useMenuEditing'

/**
 * El orden del menú y de la barra de abajo del celular, en dos grupos.
 *
 * La lista sale de los permisos de la cuenta: aquí solo se ordena lo que ya se
 * puede abrir, nunca se agrega una pantalla. Los cambios se ven al instante en
 * el menú de la página y en la barra de muestra, y se guardan solos.
 */
export function MenuEditor() {
  const { layout, isBarFull, message, reorder, step, toggleBar } = useMenuEditing()

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-muted-foreground">
        Ordena el menú y elige las {BOTTOM_BAR_SLOTS} pantallas de la barra de abajo. Solo cambia el orden: no cambia lo que puedes hacer.
      </p>
      <BottomBarPreview bar={layout.bar} hasRest={layout.rest.length > 0} />
      <MenuGroupList
        group="bar"
        title={`Barra de navegación (${String(layout.bar.length)} de ${String(BOTTOM_BAR_SLOTS)})`}
        description={isBarFull ? 'Está llena: quita una para poner otra.' : undefined}
        entries={layout.bar}
        emptyText="No hay ninguna. Pon una desde el botón «⋯» de una pantalla de «Más»."
        isBarFull={isBarFull}
        onReorder={reorder}
        onStep={step}
        onToggleBar={toggleBar}
      />
      <MenuGroupList
        group="rest"
        title="En «Más»"
        entries={layout.rest}
        emptyText="Todo está en la barra de abajo."
        isBarFull={isBarFull}
        onReorder={reorder}
        onStep={step}
        onToggleBar={toggleBar}
      />
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  )
}
