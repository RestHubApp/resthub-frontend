import type { OrderResponse } from '@/api/types'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { DiscountFields } from './DiscountFields'
import { useDiscountForm } from './useDiscountForm'

interface DiscountFormProps {
  readonly order: OrderResponse
  readonly onDone: () => void
}

/** El descuento del pedido, en porcentaje y con motivo. */
export function DiscountForm({ order, onDone }: DiscountFormProps) {
  const { register, errors, discount, submit } = useDiscountForm(order, onDone)

  return (
    <form noValidate className="flex flex-col gap-3 rounded-lg bg-muted p-3" onSubmit={onSubmit(submit)}>
      <DiscountFields register={register} errors={errors} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Volver
        </Button>
        <Button type="submit" disabled={discount.isPending}>
          {discount.isPending ? 'Aplicando…' : 'Aplicar descuento'}
        </Button>
      </div>
    </form>
  )
}
