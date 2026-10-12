import type { Session } from '@/api/types'
import { useAppearance } from '@/store/appearance'
import { layoutMenu, type MenuLayout } from './menuLayout'
import { entriesFor } from './navigation'
import type { ShellScreen } from './shellScreens'

/**
 * El menú de la cuenta: las pantallas que sus permisos abren, en el orden y con
 * la barra de abajo que eligió en «Apariencia».
 */
export function useMenuLayout(screens: readonly ShellScreen[], account: Session): MenuLayout {
  const menu = useAppearance((state) => state.appearance.menu)
  return layoutMenu(entriesFor(screens, account.permissions), menu)
}
