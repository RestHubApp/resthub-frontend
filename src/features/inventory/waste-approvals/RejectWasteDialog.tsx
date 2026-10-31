import { zodResolver } from '@hookform/resolvers/zod'

import type { WasteApproval } from '@/api/types'
import { rejectWaste } from '@/api/wasteApprovals'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { InventoryFailure } from '@/features/inventory/InventoryFailure'
import { useAppForm } from '@/hooks/useAppForm'
import * as icons from '@/components/icons'
import { MAX_REJECTION, rejectWasteSchema, type RejectWasteValues } from './rejectWasteSchema'
import { useWasteDecision } from './useWasteDecision'

interface RejectWasteDialogProps {
  /** La merma que se rechaza; `null` con la ventana cerrada. */
  readonly approval: WasteApproval | null
  readonly onClose: () => void
}

/** Rechazar una merma con su motivo: el stock no cambia. */
export function RejectWasteDialog({ approval, onClose }: RejectWasteDialogProps) {
  const { register, handleSubmit, formState, reset } = useAppForm<RejectWasteValues>({
    resolver: zodResolver(rejectWasteSchema),
    defaultValues: { reason: '' },
  })
  const close = () => {
    reset()
    onClose()
  }
  const reject = useWasteDecision({
    send: (reason: string) => rejectWaste(approval?.id ?? 0, reason),
    success: (decided) => `Merma de ${decided.ingredient_name} rechazada. El stock no cambió.`,
    onSuccess: close,
  })

  return (
    <FormDialog
      open={approval !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          close()
        }
      }}
      title={approval === null ? 'Rechazar merma' : `Rechazar la merma de ${approval.ingredient_name}`}
      description="Quien la registró verá el motivo. El stock queda como está."
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((values) => {
            reject.mutate(values.reason)
          }),
        )}
      >
        <TextareaField
          id="motivo-rechazo"
          label="Motivo del rechazo"
          rows={2}
          maxLength={MAX_REJECTION}
          placeholder="No coincide con lo que hay en cocina, falta el detalle…"
          field={register('reason')}
          error={formState.errors.reason?.message}
        />
        <InventoryFailure mutation={reject} fallback="No se pudo rechazar la merma." />
        <FormFooter mutation={reject} onCancel={close} submit={{ label: 'Rechazar merma', icon: icons.cancel, variant: 'destructive' }} />
      </form>
    </FormDialog>
  )
}
