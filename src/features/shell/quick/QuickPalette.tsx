import { useState } from 'react'

import type { Session } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Command, CommandDialog, CommandInput } from '@/components/ui/command'
import { DialogClose } from '@/components/ui/dialog'
import type { NavEntry } from '@/features/shell/navigation'
import { matchScore } from './quickSearch'
import { useQuickPalette } from './quickState'
import { QuickPaletteList } from './QuickPaletteList'
import { ResultsAnnouncer } from './ResultsAnnouncer'
import { useQuickPaletteModel } from './useQuickPaletteModel'

const TITLE = 'Buscar o ir a…'

interface QuickPaletteProps {
  /** Las pantallas del menú de la cuenta (permisos y orden ya aplicados). */
  readonly entries: readonly NavEntry[]
  readonly account: Session
}

/**
 * La paleta «Buscar o ir a…»: un diálogo con un cuadro de búsqueda y la lista de
 * lo que esta cuenta puede abrir o hacer.
 *
 * Es un combobox con lista (el cuadro conserva el foco y marca la opción activa
 * con `aria-activedescendant`). Las opciones salen de lo que la cuenta ya
 * tiene: sus pantallas del menú, la lista cerrada de acciones filtrada por
 * permiso y los ajustes de apariencia. Elegir una opción nunca ejecuta nada del
 * negocio: navega, y la pantalla de destino abre su diálogo vacío con sus
 * propias comprobaciones. Se descarga recién al abrirla por primera vez.
 */
export function QuickPalette({ entries, account }: QuickPaletteProps) {
  const isOpen = useQuickPalette((state) => state.isOpen)
  const setOpen = useQuickPalette((state) => state.setOpen)
  const [search, setSearch] = useState('')
  const { commands, run, preload, returnFocus } = useQuickPaletteModel(entries, account)

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(next) => {
        setOpen(next)
        setSearch('')
      }}
      title={TITLE}
      description="Escribe el nombre de una pantalla o de una acción. Con las flechas eliges y con Enter la abres."
      className="max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:h-[92dvh] max-sm:max-w-none max-sm:translate-x-0 max-sm:rounded-b-none! max-sm:rounded-t-2xl! sm:top-[14dvh] sm:max-w-lg"
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        returnFocus()
      }}
    >
      <Command
        label={TITLE}
        loop
        vimBindings={false}
        onValueChange={preload}
        filter={(_value, query, keywords) => matchScore(query, keywords ?? [])}
        className="max-sm:h-full"
      >
        <CommandInput placeholder={TITLE} aria-label={TITLE} value={search} onValueChange={setSearch} />
        <ResultsAnnouncer search={search} />
        <QuickPaletteList commands={commands} search={search} onRun={run} />
        <p aria-hidden="true" className="m-0 hidden border-t px-3 py-2 text-xs text-muted-foreground pointer-fine:block">
          Flechas para moverte, Enter para elegir, Esc para cerrar.
        </p>
        {/* Sin teclado no hay Escape: en el celular, un botón al alcance del pulgar. */}
        <DialogClose asChild>
          <Button type="button" variant="outline" className="m-1 sm:hidden">
            Cerrar
          </Button>
        </DialogClose>
      </Command>
    </CommandDialog>
  )
}
