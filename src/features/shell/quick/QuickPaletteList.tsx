import { CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command'
import { QUICK_GROUP_LABELS, QUICK_GROUP_ORDER, type QuickCommand } from './quickCommands'
import { QuickPaletteItem } from './QuickPaletteItem'

interface QuickPaletteListProps {
  readonly commands: readonly QuickCommand[]
  readonly search: string
  readonly onRun: (command: QuickCommand) => void
}

/** Las opciones agrupadas («Ir a», «Acciones», «Apariencia», «Cuenta»); un grupo sin opciones no sale. */
export function QuickPaletteList({ commands, search, onRun }: QuickPaletteListProps) {
  return (
    <CommandList className="max-sm:max-h-none max-sm:flex-1 sm:max-h-[min(24rem,60dvh)]">
      {/* El aviso hablado lo da `ResultsAnnouncer`; este texto es solo para quien ve la pantalla. */}
      <CommandEmpty aria-hidden="true">Nada coincide con «{search.trim()}».</CommandEmpty>
      {QUICK_GROUP_ORDER.map((group) => {
        const inGroup = commands.filter((command) => command.group === group)
        return inGroup.length === 0 ? null : (
          <CommandGroup key={group} heading={QUICK_GROUP_LABELS[group]}>
            {inGroup.map((command) => (
              <QuickPaletteItem key={command.id} command={command} onRun={onRun} />
            ))}
          </CommandGroup>
        )
      })}
    </CommandList>
  )
}
