import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'

import DialogFormActions from '../../../components/DialogFormActions'
import FormDialog from '../../../components/FormDialog'
import FormMessage from '../../../components/FormMessage'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { onSubmit } from '../../../hooks/formSubmit'
import { errorMessage } from '../../../services/api'
import CustomerLookup from './CustomerLookup'
import TakeawayConsent from './TakeawayConsent'
import TakeawayFields from './TakeawayFields'
import { withCustomer } from './takeawayCustomer'
import { EMPTY_TAKEAWAY, fromCustomer, newOrderPath, takeawaySchema, type TakeawayValues } from './takeawaySchema'

const MODOS: readonly { value: TakeawayValues['mode']; label: string }[] = [
  { value: 'takeaway', label: 'Recoge en local' },
  { value: 'delivery', label: 'Delivery' },
]

interface TakeawayFormProps {
  readonly onClose: () => void
}

/**
 * El diálogo de «Para llevar»: pide los datos del cliente y lleva a la toma
 * del pedido. Vive aparte del botón (`TakeawayDialog`) porque trae
 * react-hook-form y zod, que la primera pantalla no necesita para dibujarse.
 *
 * Si recoge en el local, el nombre es opcional pero ayuda a entregar la bolsa
 * correcta. Si es delivery, el nombre, el teléfono y la dirección son
 * obligatorios. El pedido no se crea aca, sino al enviarlo a cocina.
 */
export default function TakeawayForm({ onClose }: TakeawayFormProps) {
  const [fallo, setFallo] = useState<string | null>(null)
  const navigate = useNavigate()
  const form = useForm<TakeawayValues>({ resolver: zodResolver(takeawaySchema), defaultValues: EMPTY_TAKEAWAY })
  const mode = useWatch({ control: form.control, name: 'mode' })

  return (
    <FormDialog open onOpenChange={(abierto) => {
      if (!abierto) {
        onClose()
      }
    }} title="Pedido para llevar o delivery">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(form.handleSubmit(async (valores) => {
          setFallo(null)
          try {
            void navigate(newOrderPath(await withCustomer(valores)))
          } catch (error) {
            setFallo(errorMessage(error, 'No se pudo guardar. Los datos siguen aquí; vuelve a intentarlo.'))
          }
        }))}
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
        <TakeawayConsent form={form} />
        {fallo === null ? null : <FormMessage tone="error">{fallo}</FormMessage>}
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={() => {
            onClose()
          }}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="h-11 px-4" disabled={form.formState.isSubmitting}>
            <span>Elegir platos</span>
          </Button>
        </DialogFormActions>
      </form>
    </FormDialog>
  )
}
