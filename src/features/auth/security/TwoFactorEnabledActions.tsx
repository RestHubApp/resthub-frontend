import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface TwoFactorEnabledActionsProps {
  /** La administración del sistema la tiene obligatoria: no se le ofrece apagarla. */
  readonly canDisable: boolean
  readonly isDisabling: boolean
  readonly onRenew: () => void
  readonly onDisable: () => void
}

/** Lo que se puede hacer con la verificación ya activa: renovar los códigos y, si se puede, apagarla. */
export function TwoFactorEnabledActions({ canDisable, isDisabling, onRenew, onDisable }: TwoFactorEnabledActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onRenew}>
        <Icon name="retry" size={16} />
        <span>Nuevos códigos de recuperación</span>
      </Button>
      {canDisable ? (
        <ConfirmDialog
          trigger={<Button type="button" variant="outline" disabled={isDisabling}>Desactivar</Button>}
          title="¿Desactivar la verificación en dos pasos?"
          description="Para entrar bastará tu contraseña. Los códigos de recuperación dejan de servir."
          confirmLabel="Desactivar"
          confirmVariant="destructive"
          onConfirm={onDisable}
        />
      ) : null}
    </>
  )
}
