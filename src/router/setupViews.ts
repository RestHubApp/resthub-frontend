import { lazyNamed } from '@/components/lazyNamed'
import type { AccountSetupViews } from '@/features/shell/security/AccountSetupGate'

// Lo que tapa el armazón mientras a la cuenta le falte algo (RFS-20, RFS-22):
// se descarga recién cuando hace falta.
export const SETUP_VIEWS: AccountSetupViews = {
  passwordChange: lazyNamed(() => import('@/features/auth/TemporaryPasswordView'), 'TemporaryPasswordView'),
  twoFactorSetup: lazyNamed(() => import('@/features/auth/TwoFactorSetupView'), 'TwoFactorSetupView'),
}
