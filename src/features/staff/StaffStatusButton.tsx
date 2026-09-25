import { useMutation, useQueryClient } from '@tanstack/react-query'

import { changeStaffStatus, staffQueryKey } from '../../api/staff'
import type { StaffResponse } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'

interface StaffStatusButtonProps {
  readonly account: StaffResponse
  /** La cuenta propia no se desactiva: quien lo hace se queda afuera. */
  readonly disabled: boolean
}

/**
 * Activa o desactiva una cuenta.
 *
 * Desactivar se confirma, porque la persona deja de poder entrar en ese mismo
 * momento, quiza a mitad de un turno. Activar no quita nada y va directo.
 */
export default function StaffStatusButton({ account, disabled }: StaffStatusButtonProps) {
  const queryClient = useQueryClient()
  const estado = useMutation({
    mutationFn: () => changeStaffStatus(account.id, !account.is_active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey })
    },
  })
  const cambiar = () => {
    estado.mutate()
  }

  const boton = (
    <Button
      type="button"
      size="sm"
      variant={account.is_active ? 'ghost' : 'success'}
      disabled={disabled || estado.isPending}
      onClick={account.is_active ? undefined : cambiar}
    >
      <Icon name="encender" size={14} />
      <span>{account.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )

  return (
    <>
      {account.is_active && !disabled ? (
        <ConfirmDialog
          trigger={boton}
          title={`¿Desactivar a ${account.full_name}?`}
          description="No podrá entrar a RestHub hasta que vuelvas a activar su cuenta. Sus pedidos y registros se conservan."
          confirmLabel="Desactivar"
          onConfirm={cambiar}
        />
      ) : (
        boton
      )}
      {estado.isError ? (
        <FormMessage tone="error">
          {errorMessage(estado.error, 'No se pudo actualizar la cuenta.')}
        </FormMessage>
      ) : null}
    </>
  )
}
