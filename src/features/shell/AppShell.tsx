import type { PermissionCode } from '@/api/types'
import { isPreviewTab } from '@/services/tabStorage'
import { staffOf, useSession } from '@/store/session'
import { PreviewEndedGate } from './PreviewEndedGate'
import { LockGate } from './security/LockGate'
import { AccountSetupGate, type AccountSetupViews } from './security/AccountSetupGate'
import type { ShellScreen } from './shellScreens'
import { SignedInShell } from './SignedInShell'
import { SignedOutShell } from './SignedOutShell'
import { useAccountRefresh } from './useAccountRefresh'
import { useOfflineWarmup } from './useOfflineWarmup'
import { useSessionRenewal } from './useSessionRenewal'

const WITHOUT_SCREENS: readonly ShellScreen[] = []
const WITHOUT_PERMISSIONS: readonly PermissionCode[] = []
const WITHOUT_SETUP_VIEWS: AccountSetupViews = {}

interface AppShellProps {
  /** Las pantallas del registro: de ellas salen el menú y lo que se adelanta al acercarse a un enlace. */
  readonly screens?: readonly ShellScreen[]
  /** Lo que tapa el armazón mientras a la cuenta le falte algo (contraseña propia, dos pasos). */
  readonly setupViews?: AccountSetupViews
}

/**
 * El armazon de todas las pantallas, para el personal y para la administración
 * del sistema.
 *
 * Sin sesion solo esta el acceso: la marca arriba y el formulario al centro.
 * Con sesion hay dos disposiciones. En pantallas anchas, la laptop del
 * encargado, el menu va en una barra lateral. En el celular del mesero va en
 * una barra inferior, y arriba queda el nombre del restaurante; el contenido
 * reserva abajo el alto de esa barra para que nada quede tapado. Una sesión
 * bloqueada por inactividad solo muestra el desbloqueo.
 */
export function AppShell({ screens = WITHOUT_SCREENS, setupViews = WITHOUT_SETUP_VIEWS }: AppShellProps) {
  const account = useSession((state) => state.account)
  useAccountRefresh()
  useSessionRenewal()
  // Las pantallas sin señal son del mesero: la administración del sistema no las baja.
  useOfflineWarmup(screens, staffOf(account)?.permissions ?? WITHOUT_PERMISSIONS)

  // Una pestaña de vista previa sin sesión no ofrece el acceso normal.
  if (account === null && isPreviewTab()) {
    return <PreviewEndedGate />
  }
  if (account === null) {
    return <SignedOutShell />
  }
  return (
    <AccountSetupGate account={account} views={setupViews}>
      <LockGate account={account}>
        <SignedInShell account={account} screens={screens} />
      </LockGate>
    </AccountSetupGate>
  )
}
