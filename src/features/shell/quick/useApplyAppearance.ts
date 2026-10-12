import { useQuickAppearance } from '@/features/shell/useQuickAppearance'
import { stepTextSize, TEXT_SIZES } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { useNotifications } from '@/store/notifications'
import type { QuickCommand, QuickEffect } from './quickCommands'

export type AppearanceEffect = Exclude<QuickEffect, { readonly type: 'navigate' | 'signOut' }>

function notify(message: string): void {
  useNotifications.getState().push({ tone: 'info', message })
}

/**
 * Aplica una opción de «Apariencia» de la paleta con el mismo almacén de la
 * pantalla completa (`useQuickAppearance`) y avisa qué quedó puesto, porque al
 * cerrarse la paleta quien usa lector de pantalla no oye el cambio.
 */
export function useApplyAppearance() {
  const quick = useQuickAppearance()
  const textSize = useAppearance((state) => state.appearance.textSize)

  return (effect: AppearanceEffect, command: QuickCommand) => {
    if (effect.type === 'mode') {
      quick.setMode(effect.mode)
      notify(command.label)
    } else if (effect.type === 'textSize') {
      const next = stepTextSize(textSize, effect.step)
      quick.setTextSize(next)
      notify(`Texto: ${TEXT_SIZES.find((size) => size.id === next)?.label.toLowerCase() ?? ''}`)
    } else {
      quick.toggleHighContrast()
      notify(quick.isHighContrast ? 'Alto contraste desactivado' : 'Alto contraste activado')
    }
  }
}
