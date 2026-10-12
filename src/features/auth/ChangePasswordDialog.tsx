import { useState } from 'react'

import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useScreenAction } from '@/hooks/useScreenAction'
import { ChangePasswordForm } from './ChangePasswordForm'

/**
 * «Cambiar contraseña» como botón que abre una ventana con el formulario.
 *
 * Solo cambia dónde se ve el formulario: la contraseña actual, la validación
 * y lo que pasa con la sesión siguen en `ChangePasswordForm`. También se abre
 * desde la dirección (`?accion=cambiar-contrasena`).
 */
export function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const request = useScreenAction('cambiar-contrasena')

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        <Icon name="key" size={16} />
        <span>Cambiar contraseña</span>
      </Button>
      <FormDialog
        open={isOpen || request.isRequested}
        onOpenChange={(isNowOpen) => {
          setIsOpen(isNowOpen)
          if (!isNowOpen) {
            request.clear()
          }
        }}
        title="Cambiar contraseña"
        description="Escribe la contraseña actual y la nueva dos veces."
      >
        <ChangePasswordForm />
      </FormDialog>
    </>
  )
}
