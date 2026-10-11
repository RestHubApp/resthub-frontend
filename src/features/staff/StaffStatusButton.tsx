import { useMutation, useQueryClient } from '@tanstack/react-query'

import { changeStaffStatus } from '@/api/staff'
import type { StaffResponse } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/apiError'
import { saveStaffMember } from './staffList'

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
export function StaffStatusButton({ account, disabled }: StaffStatusButtonProps) {
  const queryClient = useQueryClient()
  const status = useMutation({
    mutationFn: () => changeStaffStatus(account.id, !account.is_active),
    onSuccess: (updatedAccount) => {
      saveStaffMember(queryClient, updatedAccount)
    },
  })
  const change = () => {
    status.mutate()
  }

  const button = (
    <Button
      type="button"
      size="sm"
      variant={account.is_active ? 'ghost' : 'success'}
      disabled={disabled || status.isPending}
      onClick={account.is_active ? undefined : change}
    >
      <Icon name="turnOn" size={14} />
      <span>{account.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )

  return (
    <>
      {account.is_active && !disabled ? (
        <ConfirmDialog
          trigger={button}
          title={`¿Desactivar a ${account.full_name}?`}
          description="No podrá entrar a RestHub hasta que vuelvas a activar su cuenta. Sus pedidos y registros se conservan."
          confirmLabel="Desactivar"
          onConfirm={change}
        />
      ) : (
        button
      )}
      {status.isError ? (
        <FormMessage tone="error">
          {errorMessage(status.error, 'No se pudo actualizar la cuenta.')}
        </FormMessage>
      ) : null}
    </>
  )
}
