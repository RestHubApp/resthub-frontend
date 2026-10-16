import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FormFooter } from '@/components/FormFooter'
import type { FooterSubmit } from '@/components/FormSubmitButton'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { QuickReasons } from '@/features/orders/QuickReasons'
import { MAX_INVOICE_VOID_REASON, MIN_INVOICE_VOID_REASON, QUICK_INVOICE_VOID_REASONS } from './invoiceVoid'

const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(MIN_INVOICE_VOID_REASON, `Escribe el motivo, de al menos ${String(MIN_INVOICE_VOID_REASON)} caracteres`)
    .max(MAX_INVOICE_VOID_REASON, `Usa como máximo ${String(MAX_INVOICE_VOID_REASON)} caracteres`),
})
type ReasonValues = z.infer<typeof reasonSchema>

interface VoidReasonStepProps {
  readonly reason: string
  readonly isPending: boolean
  readonly submit: Omit<FooterSubmit, 'onClick'>
  readonly onCancel: () => void
  readonly onReason: (reason: string) => void
  readonly children?: React.ReactNode
}

/** El motivo de la anulación, escrito o elegido entre los rápidos. Va a SUNAT en la nota de crédito. */
export function VoidReasonStep({ reason, isPending, submit, onCancel, onReason, children }: VoidReasonStepProps) {
  const { register, handleSubmit, formState, setValue } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason },
  })

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(handleSubmit((values) => {
      onReason(values.reason)
    }))}>
      <QuickReasons
        reasons={QUICK_INVOICE_VOID_REASONS}
        onPick={(picked) => {
          setValue('reason', picked, { shouldValidate: true })
        }}
      />
      <TextareaField
        id="motivo-anulacion-comprobante"
        label="Motivo de la anulación"
        placeholder="Por qué se anula el comprobante"
        maxLength={MAX_INVOICE_VOID_REASON}
        field={register('reason')}
        error={formState.errors.reason?.message}
      />
      {children}
      <FormFooter mutation={{ isPending }} onCancel={onCancel} submit={submit} />
    </form>
  )
}
