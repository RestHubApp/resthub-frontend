import { useState } from 'react'

import type { OrderResponse, PaymentResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import { VoidPaymentForm } from './VoidPaymentForm'

interface VoidPaymentButtonProps {
  readonly order: OrderResponse
  readonly payment: PaymentResponse
}

/** «Anular» al lado de un cobro mal hecho, con la ventana que pide el motivo (RFS-25). */
export function VoidPaymentButton({ order, payment }: VoidPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const what = `${formatMoney(payment.amount)} en ${payment.method_label}`

  return (
    <>
      <Button type="button" variant="ghost" size="sm" aria-label={`Anular el cobro de ${what}`} onClick={() => { setIsOpen(true) }}>
        <Icon name="cancel" size={14} />
        <span>Anular</span>
      </Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={`¿Anular el cobro de ${what}?`}
        description="Queda a la vista con su motivo, sale de la caja y el pedido vuelve a deber ese monto. Solo se anulan cobros del turno de caja abierto."
      >
        <VoidPaymentForm order={order} payment={payment} onClose={() => { setIsOpen(false) }} />
      </FormDialog>
    </>
  )
}
