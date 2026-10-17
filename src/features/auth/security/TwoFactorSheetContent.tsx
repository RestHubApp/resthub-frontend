import { ErrorMessage } from '@/components/ErrorMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RecoveryCodes } from './RecoveryCodes'
import { TwoFactorSetupStep } from './TwoFactorSetupStep'
import type { useTwoFactor } from './useTwoFactor'

interface TwoFactorSheetContentProps {
  readonly twoFactor: ReturnType<typeof useTwoFactor>
  readonly onClose: () => void
}

/** Lo que muestra la hoja: el alta en curso o los códigos de recuperación recién dados. */
export function TwoFactorSheetContent({ twoFactor, onClose }: TwoFactorSheetContentProps) {
  const { begin, confirm, renew } = twoFactor
  const codes = confirm.data ?? renew.data
  if (codes !== undefined) return <RecoveryCodes codes={codes} onDone={onClose} />
  if (renew.isPending || begin.isPending) return <ListSkeleton label="Preparando…" count={3} />
  if (renew.isError) return <ErrorMessage error={renew.error} fallback="No se pudieron generar los códigos." />
  if (begin.isError) return <ErrorMessage error={begin.error} fallback="No se pudo empezar la configuración." />
  if (begin.data === undefined) return null
  return <TwoFactorSetupStep setup={begin.data} confirm={confirm} onCancel={onClose} />
}
