import { useRef } from 'react'
import { useNavigate } from 'react-router'

import type { Session } from '@/api/types'
import type { NavEntry } from '@/features/shell/navigation'
import { preloadScreen, useShellScreens } from '@/features/shell/shellScreens'
import { useQuickAppearance } from '@/features/shell/useQuickAppearance'
import { useSignOut } from '@/features/shell/useSignOut'
import { usePreview } from '@/store/session'
import { buildQuickCommands, type QuickCommand } from './quickCommands'
import { restoreFocus, useQuickPalette } from './quickState'
import { useApplyAppearance } from './useApplyAppearance'

/**
 * Lo que la paleta muestra y hace para esta cuenta: las opciones (permisos,
 * vista previa y apariencia actual ya aplicados), qué pasa al elegir una, y a
 * dónde vuelve el foco al cerrar.
 */
export function useQuickPaletteModel(entries: readonly NavEntry[], account: Session) {
  const setOpen = useQuickPalette((state) => state.setOpen)
  const askSignOut = useQuickPalette((state) => state.askSignOut)
  const quick = useQuickAppearance()
  const screens = useShellScreens()
  const navigate = useNavigate()
  const applyAppearance = useApplyAppearance()
  const { pending, signOut } = useSignOut()
  const shouldFocusContent = useRef(false)

  const commands = buildQuickCommands({
    entries,
    account,
    isPreview: usePreview(),
    mode: quick.mode,
    isHighContrast: quick.isHighContrast,
    canSmaller: quick.canSmaller,
    canLarger: quick.canLarger,
  })

  const run = (command: QuickCommand) => {
    const { effect } = command
    shouldFocusContent.current = effect.type === 'navigate'
    setOpen(false)
    if (effect.type === 'navigate') {
      void navigate(effect.to)
    } else if (effect.type !== 'signOut') {
      applyAppearance(effect, command)
    } else if (pending.length === 0) {
      signOut()
    } else {
      // Con pedidos sin enviar, la salida pide confirmación (la muestra `QuickPaletteHost`).
      askSignOut(true)
    }
  }

  // Al resaltar una pantalla se adelanta su archivo y sus datos, como en el menú.
  const preload = (id: string) => {
    const command = commands.find((candidate) => candidate.id === id)
    const path = command?.effect.type === 'navigate' ? command.effect.to.split('?')[0] : undefined
    const screen = screens.find((candidate) => candidate.path === path)
    if (screen !== undefined) {
      preloadScreen(screen)
    }
  }

  // Tras ir a otra pantalla el foco va a su contenido; si no, vuelve a quien lo tenía.
  const returnFocus = () => {
    if (shouldFocusContent.current) {
      shouldFocusContent.current = false
      document.getElementById('contenido')?.focus()
    } else {
      restoreFocus()
    }
  }

  return { commands, run, preload, returnFocus }
}
