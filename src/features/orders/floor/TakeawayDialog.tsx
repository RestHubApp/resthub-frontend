import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { saveCustomer } from '../../../api/customers'
import DialogFormActions from '../../../components/DialogFormActions'
import FormDialog from '../../../components/FormDialog'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { onSubmit } from '../../../hooks/formSubmit'
import CustomerLookup from './CustomerLookup'
import TakeawayFields from './TakeawayFields'
import { EMPTY_TAKEAWAY, fromCustomer, newOrderPath, takeawaySchema, type TakeawayValues } from './takeawaySchema'

const MODOS: readonly { value: TakeawayValues['mode']; label: string }[] = [
  { value: 'takeaway', label: 'Recoge en local' },
  { value: 'delivery', label: 'Delivery' },
]

/**
 * Un delivery a alguien que no está en la libreta lo agrega, así la próxima
 * vez no dicta su dirección. Si ya estaba (mismo teléfono) o no hay señal, se
 * sigue igual: el servidor lo reconoce por el teléfono al abrir el pedido.
 */
async function withCustomer(values: TakeawayValues): Promise<TakeawayValues> {
  if (values.mode !== 'delivery' || values.customer_id !== null || values.phone === '') {
    return values
  }
  try {
    const nuevo = await saveCustomer({
      name: values.customer_name,
      phone: values.phone,
      email: '',
      address: values.address,
      reference: values.reference,
      notes: '',
    })
    return { ...values, customer_id: nuevo.id }
  } catch {
    return values
  }
}

/**
 * "Para llevar": pide los datos del cliente y lleva a la toma del pedido.
 *
 * Si recoge en el local, el nombre es opcional pero ayuda a entregar la bolsa
 * correcta. Si es delivery, el nombre, el teléfono y la dirección son
 * obligatorios. El pedido no se crea aca, sino al enviarlo a cocina.
 */
export default function TakeawayDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const form = useForm<TakeawayValues>({ resolver: zodResolver(takeawaySchema), defaultValues: EMPTY_TAKEAWAY })
  const mode = useWatch({ control: form.control, name: 'mode' })

  const cambiar = (abierto: boolean) => {
    setOpen(abierto)
    if (!abierto) {
      form.reset(EMPTY_TAKEAWAY)
    }
  }

  return (
    <>
      <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
        cambiar(true)
      }}>
        <Icon name="llevar" size={18} />
        <span>Para llevar / Delivery</span>
      </Button>
      <FormDialog open={open} onOpenChange={cambiar} title="Pedido para llevar o delivery">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={onSubmit(form.handleSubmit(async (valores) => navigate(newOrderPath(await withCustomer(valores)))))}
        >
          <div role="radiogroup" aria-label="Cómo se entrega" className="grid grid-cols-2 gap-2">
            {MODOS.map((modo) => (
              <Button
                key={modo.value}
                type="button"
                role="radio"
                aria-checked={mode === modo.value}
                variant={mode === modo.value ? 'default' : 'outline'}
                size="lg"
                className="h-11"
                onClick={() => {
                  form.setValue('mode', modo.value)
                }}
              >
                <Icon name={modo.value === 'delivery' ? 'delivery' : 'llevar'} size={16} />
                <span>{modo.label}</span>
              </Button>
            ))}
          </div>
          <CustomerLookup onPick={(cliente) => {
            form.reset(fromCustomer(cliente, form.getValues('mode')))
          }} />
          <TakeawayFields form={form} delivery={mode === 'delivery'} />
          <DialogFormActions>
            <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={() => {
              cambiar(false)
            }}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="h-11 px-4">
              <span>Elegir platos</span>
            </Button>
          </DialogFormActions>
        </form>
      </FormDialog>
    </>
  )
}
