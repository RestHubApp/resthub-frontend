import { DetailSheet } from '@/components/DetailSheet'
import { TwoFactorSheetContent } from './TwoFactorSheetContent'
import type { useTwoFactor } from './useTwoFactor'

interface TwoFactorSheetProps {
  readonly open: boolean
  readonly twoFactor: ReturnType<typeof useTwoFactor>
  readonly onClose: () => void
}

/** La hoja de la verificación en dos pasos: configurarla o ver los códigos nuevos. */
export function TwoFactorSheet({ open, twoFactor, onClose }: TwoFactorSheetProps) {
  const isShowingCodes = (twoFactor.confirm.data ?? twoFactor.renew.data) !== undefined
  return (
    <DetailSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title={isShowingCodes ? 'Códigos de recuperación' : 'Activar la verificación en dos pasos'}
    >
      <TwoFactorSheetContent twoFactor={twoFactor} onClose={onClose} />
    </DetailSheet>
  )
}
