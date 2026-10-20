import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { reauthenticate } from '@/api/accountSecurity'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { useReauthentication } from '@/store/reauthentication'
import { type CurrentPasswordValues, currentPasswordSchema } from '@/services/securityRules'

/**
 * «Confirma tu contraseña» antes de una acción crítica (RFS-21).
 *
 * La abre el cliente HTTP cuando el servidor la exige; al confirmar, la acción
 * que se estaba guardando se repite sola. Vale unos minutos y solo en este
 * dispositivo: alguien que encuentra la sesión abierta no puede cambiar los
 * datos fiscales, los roles ni desactivar cuentas.
 */
export function ReauthenticationDialog() {
  const settle = useReauthentication((state) => state.settle)
  const { register, handleSubmit, formState } = useAppForm<CurrentPasswordValues>({
    resolver: zodResolver(currentPasswordSchema),
    defaultValues: { password: '' },
  })
  const confirm = useMutation({
    mutationFn: (values: CurrentPasswordValues) => reauthenticate(values.password),
    onSuccess: () => {
      settle(true)
    },
  })
  const cancel = () => {
    settle(false)
  }

  return (
    <FormDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) cancel()
      }}
      title="Confirma tu contraseña"
      description="Esta acción cambia algo delicado del restaurante. Tu contraseña vale por unos minutos en este dispositivo."
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((values) => {
            confirm.mutate(values)
          }),
        )}
      >
        <PasswordField
          id="reauthentication_password"
          label="Tu contraseña"
          autoComplete="current-password"
          field={register('password')}
          error={formState.errors.password?.message}
        />
        <FormFooter
          mutation={confirm}
          failureText="No se pudo confirmar la contraseña."
          onCancel={cancel}
          submit={{ label: 'Confirmar', pendingLabel: 'Confirmando…', icon: 'key' }}
        />
      </form>
    </FormDialog>
  )
}
