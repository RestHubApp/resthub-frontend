import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { CommandItem } from '@/components/ui/command'
import type { QuickCommand } from './quickCommands'

interface QuickPaletteItemProps {
  readonly command: QuickCommand
  readonly onRun: (command: QuickCommand) => void
}

/** Una opción de la paleta: su icono, su nombre, su descripción corta y si es el ajuste que ya está puesto. */
export function QuickPaletteItem({ command, onRun }: QuickPaletteItemProps) {
  return (
    <CommandItem
      value={command.id}
      keywords={[command.label, command.description ?? '', ...command.synonyms]}
      onSelect={() => {
        onRun(command)
      }}
    >
      <Icon glyph={command.icon} size={18} className="text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate font-medium">{command.label}</span>
        {command.description === undefined ? null : (
          <span className="truncate text-xs text-muted-foreground">{command.description}</span>
        )}
      </span>
      {command.isActive === true ? (
        <>
          <Icon glyph={icons.confirm} size={16} className="text-primary" />
          <span className="sr-only">(activo)</span>
        </>
      ) : null}
    </CommandItem>
  )
}
