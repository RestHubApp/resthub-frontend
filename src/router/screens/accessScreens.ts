import { asDefault } from '@/components/lazyNamed'
import { routePatterns } from '@/services/paths'
import type { Screen } from './screenTypes'

/** Las pantallas de acceso y cuenta. */
export const ACCESS_SCREENS: readonly Screen[] = [
  { path: routePatterns.login, public: true, load: asDefault(() => import('@/features/auth/LoginView'), 'LoginView') },
  // Pública: se lee antes de entrar o desde la pantalla que pide aceptarla.
  { path: routePatterns.privacy, public: true, load: asDefault(() => import('@/features/legal/PrivacyView'), 'PrivacyView') },
  { path: routePatterns.profile, load: asDefault(() => import('@/features/auth/ProfileView'), 'ProfileView') },
]
