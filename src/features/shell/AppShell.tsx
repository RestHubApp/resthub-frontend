import type { PermissionCode } from '@/api/types'
import { isPreviewTab } from '@/services/tabStorage'
import { useSession } from '@/store/session'
import { PreviewEndedView } from './PreviewEndedView'
import type { ShellScreen } from './shellScreens'
import { SignedInShell } from './SignedInShell'
import { SignedOutShell } from './SignedOutShell'
import { useAccountRefresh } from './useAccountRefresh'
import { useOfflineWarmup } from './useOfflineWarmup'
import { useSessionRenewal } from './useSessionRenewal'

const WITHOUT_SCREENS: readonly ShellScreen[] = []
const WITHOUT_PERMISSIONS: readonly PermissionCode[] = []

interface AppShellProps {
  /** Las pantallas del registro: de ellas salen el menú y lo que se adelanta al acercarse a un enlace. */
  readonly screens?: readonly ShellScreen[]
}

/**
 * El armazon de todas las pantallas.
 *
 * Sin sesion solo esta el acceso: la marca arriba y el formulario al centro.
 * Con sesion hay dos disposiciones. En pantallas anchas, la laptop del
 * encargado, el menu va en una barra lateral. En el celular del mesero va en
 * una barra inferior, y arriba queda el nombre del restaurante; el contenido
 * reserva abajo el alto de esa barra para que nada quede tapado.
 */
export function AppShell({ screens = WITHOUT_SCREENS }: AppShellProps) {
  const account = useSession((state) => state.account)
  useAccountRefresh()
  useSessionRenewal()
  useOfflineWarmup(screens, account?.permissions ?? WITHOUT_PERMISSIONS)

  // Una pestaña de vista previa sin sesión no ofrece el acceso normal.
  if (account === null && isPreviewTab()) {
    return <PreviewEndedView />
  }
  if (account === null) {
    return <SignedOutShell />
  }
  return <SignedInShell account={account} screens={screens} />
}
