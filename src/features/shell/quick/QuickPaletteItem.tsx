import { Icon } from '@/components/Icon'
import { CommandItem } from '@/components/ui/command'
import { ShellIcon } from '@/features/shell/ShellIcon'
import type { QuickCommand } from './quickCommands'

interface QuickPaletteItemProps {
  readonly command: QuickCommand
  readonly onRun: (command: QuickCommand) => void
}

/** Una opción de la paleta: su icono, su nombre, su descripción corta y si es el ajuste que ya está puesto. */
export function QuickPaletteItem({ command, onRun }: QuickPaletteItemProps) {
  const className = 'text-muted-foreground'
  return (
    <CommandItem
      value={command.id}
      keywords={[command.label, command.description ?? '', ...command.synonyms]}
      onSelect={() => {
        onRun(command)
      }}
    >
      {'shell' in command.icon ? (
        <ShellIcon name={command.icon.shell} size={18} className={className} />
      ) : (
        <Icon name={command.icon.general} size={18} className={className} />
      )}
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate font-medium">{command.label}</span>
        {command.description === undefined ? null : (
          <span className="truncate text-xs text-muted-foreground">{command.description}</span>
        )}
      </span>
      {command.isActive === true ? (
        <>
          <Icon name="confirm" size={16} className="text-primary" />
          <span className="sr-only">(activo)</span>
        </>
      ) : null}
    </CommandItem>
  )
}
