import { create } from 'zustand'

import { type Appearance, DEFAULT_APPEARANCE, SYSTEM_THEME } from '@/services/appearanceRules'
import { appearanceKey, readAppearance, writeAppearance } from '@/services/appearanceStorage'
import { applyAppearance, watchSystemTheme } from '@/services/applyAppearance'
import { useSession } from './session'

interface AppearanceState {
  /** Las preferencias de la cuenta con sesión; sin sesión, las de fábrica. */
  appearance: Appearance
  /** Cambia algunas preferencias: se aplican al instante y se guardan para esta cuenta. */
  change: (changes: Partial<Appearance>) => void
  /** Vuelve a las preferencias de fábrica. */
  reset: () => void
}

// La clave de la cuenta cuyas preferencias están cargadas. Es la que se usa para
// guardar; sin sesión es `null` y nada se escribe.
const loaded: { key: string | null } = {
  key: (() => {
    const { account } = useSession.getState()
    return account === null ? null : appearanceKey(account)
  })(),
}

function persist(appearance: Appearance): void {
  applyAppearance(appearance)
  if (loaded.key !== null) {
    writeAppearance(loaded.key, appearance)
  }
}

/**
 * Las preferencias de apariencia de la cuenta con sesión.
 *
 * Se leen del aparato al cargar la página y cada vez que cambia la cuenta (otra
 * persona entra en el mismo celular, o se cierra la sesión), y se aplican a
 * <html>. Se importa desde `main.tsx` antes de montar React, así la página sale
 * con su tema desde el primer pintado.
 */
export const useAppearance = create<AppearanceState>((set, get) => ({
  appearance: loaded.key === null ? DEFAULT_APPEARANCE : readAppearance(loaded.key),
  change: (changes) => {
    const appearance = { ...get().appearance, ...changes }
    set({ appearance })
    persist(appearance)
  },
  reset: () => {
    set({ appearance: DEFAULT_APPEARANCE })
    persist(DEFAULT_APPEARANCE)
  },
}))

applyAppearance(useAppearance.getState().appearance)

// Otra cuenta, o ninguna: se cargan sus preferencias (las de fábrica sin sesión,
// así la pantalla de acceso no hereda el tema de quien salió).
useSession.subscribe((state) => {
  const key = state.account === null ? null : appearanceKey(state.account)
  if (key === loaded.key) {
    return
  }
  loaded.key = key
  const appearance = key === null ? DEFAULT_APPEARANCE : readAppearance(key)
  useAppearance.setState({ appearance })
  applyAppearance(appearance)
})

// «Según el sistema» sigue al aparato mientras la página está abierta.
watchSystemTheme(() => {
  const { appearance } = useAppearance.getState()
  if (appearance.theme === SYSTEM_THEME) {
    applyAppearance(appearance)
  }
})
