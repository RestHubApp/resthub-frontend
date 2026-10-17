import { useState } from 'react'

import type { StaffResponse } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Lo que acepta el servidor (RFS-18): de 3 a 200 caracteres.
const MIN_REASON = 3
const MAX_REASON = 200

interface StaffDeactivateConfirmProps {
  readonly account: StaffResponse
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Desactiva la cuenta con el motivo escrito. */
  readonly onDeactivate: (reason: string) => void
}

/**
 * Confirmar la desactivación de una cuenta, con su motivo (RFS-18): queda en
 * la ficha quién la desactivó, cuándo y por qué.
 */
export function StaffDeactivateConfirm({ account, open, onOpenChange, onDeactivate }: StaffDeactivateConfirmProps) {
  const [reason, setReason] = useState('')
  const written = reason.trim()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setReason('')
        onOpenChange(isOpen)
      }}
      title={`¿Desactivar a ${account.full_name}?`}
      description="Se cierran sus sesiones abiertas y no podrá entrar a RestHub hasta que vuelvas a activar su cuenta. Sus pedidos y registros se conservan."
      confirmLabel="Desactivar"
      isConfirmDisabled={written.length < MIN_REASON}
      onConfirm={() => { onDeactivate(written) }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="motivo-desactivar">Motivo</Label>
        <Textarea
          id="motivo-desactivar"
          rows={2}
          maxLength={MAX_REASON}
          placeholder="Por ejemplo: ya no trabaja en el local"
          aria-describedby="motivo-desactivar-ayuda"
          value={reason}
          onChange={(event) => { setReason(event.target.value) }}
        />
        <p id="motivo-desactivar-ayuda" className="m-0 text-sm text-muted-foreground">
          {`De ${String(MIN_REASON)} a ${String(MAX_REASON)} caracteres. Queda en la ficha de la cuenta.`}
        </p>
      </div>
    </ConfirmDialog>
  )
}
