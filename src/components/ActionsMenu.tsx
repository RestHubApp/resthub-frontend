import { Icon } from './Icon'
import type { IconName } from './icons'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useDeferredAction } from './useDeferredAction'

/** Una acción secundaria dentro del menú «⋯». */
export interface ActionsMenuItem {
  readonly label: string
  readonly icon?: IconName
  readonly onSelect: () => void
  /** Una acción que quita algo: va en rojo y, por convención, al final. */
  readonly isDestructive?: boolean
  readonly isDisabled?: boolean
}

interface ActionsMenuProps {
  /** Nombre accesible del botón «⋯»: dice de qué fila o pedido son las acciones. */
  readonly label: string
  readonly items: readonly ActionsMenuItem[]
  /** El texto visible junto a los tres puntos; sin él, es solo el icono. */
  readonly text?: string
}

/**
 * Las acciones secundarias de una fila o de un pedido tras un botón «⋯».
 *
 * Deja a la vista una sola acción principal y evita las filas de botones que
 * se recortan en el celular. Las acciones destructivas se separan al final.
 */
export function ActionsMenu({ label, items, text }: ActionsMenuProps) {
  const regular = items.filter((item) => item.isDestructive !== true)
  const destructive = items.filter((item) => item.isDestructive === true)
  const { choose, onCloseAutoFocus } = useDeferredAction()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={text === undefined ? 'icon-sm' : 'default'}
          aria-label={label}
        >
          <Icon name="more" size={18} />
          {text === undefined ? null : <span>{text}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={onCloseAutoFocus}>
        {regular.map((item) => renderEntry(item, choose))}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((item) => renderEntry(item, choose))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function renderEntry(item: ActionsMenuItem, choose: (action: () => void) => void) {
  return (
    <DropdownMenuItem
      key={item.label}
      variant={item.isDestructive === true ? 'destructive' : 'default'}
      disabled={item.isDisabled === true}
      onSelect={() => {
        choose(item.onSelect)
      }}
    >
      {item.icon === undefined ? null : <Icon name={item.icon} size={16} />}
      <span>{item.label}</span>
    </DropdownMenuItem>
  )
}
