import { Button } from '@/components/ui/button'
import { BOTTOM_BAR_SLOTS } from '@/services/appearanceRules'
import { BottomBarPreview } from './BottomBarPreview'
import { MenuRow } from './MenuRow'
import { useMenuEditing } from './useMenuEditing'

/**
 * El orden del menú y de la barra de abajo del celular.
 *
 * La lista sale de los permisos de la cuenta: aquí solo se ordena lo que ya se
 * puede abrir, nunca se agrega una pantalla. Los cambios se ven al instante en
 * el menú de la página y en la miniatura de la barra, y se guardan solos.
 */
export function MenuEditor() {
  const { layout, message, move, toggleBar, reset } = useMenuEditing()
  const isBarFull = layout.bar.length >= BOTTOM_BAR_SLOTS
  const inBar = new Set(layout.bar)

  return (
    <div className="flex flex-col gap-4">
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {layout.ordered.map((entry, index) => (
          <MenuRow
            key={entry.to}
            entry={entry}
            index={index}
            count={layout.ordered.length}
            isInBar={inBar.has(entry)}
            isBarFull={isBarFull}
            onMove={move}
            onToggleBar={toggleBar}
          />
        ))}
      </ol>
      <p role="status" className="sr-only">
        {message}
      </p>
      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm text-muted-foreground">
          En la barra de abajo del celular: {layout.bar.length} de {BOTTOM_BAR_SLOTS}.{' '}
          {isBarFull ? 'Está llena: quita una para poner otra. ' : ''}Lo demás queda en «Más».
        </p>
        <BottomBarPreview bar={layout.bar} hasRest={layout.rest.length > 0} />
      </div>
      <div>
        <Button type="button" variant="outline" onClick={reset}>
          Restablecer el menú
        </Button>
      </div>
    </div>
  )
}
