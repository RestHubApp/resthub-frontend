import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { onSubmit } from '@/hooks/formSubmit'
import { CustomerLookup } from './CustomerLookup'
import { TakeawayConsent } from './TakeawayConsent'
import { TakeawayFields } from './TakeawayFields'
import { TakeawayModePicker } from './TakeawayModePicker'
import { fromCustomer } from './takeawaySchema'
import { useTakeawayForm } from './useTakeawayForm'

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
export function TakeawayForm({ onClose }: TakeawayFormProps) {
  const { form, mode, failure, submit } = useTakeawayForm()

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title="Pedido para llevar o delivery"
    >
      <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(submit)}>
        <TakeawayModePicker
          value={mode}
          onChange={(next) => {
            form.setValue('mode', next)
          }}
        />
        <CustomerLookup
          onPick={(customer) => {
            form.reset(fromCustomer(customer, form.getValues('mode')))
          }}
        />
        <TakeawayFields form={form} delivery={mode === 'delivery'} />
        <TakeawayConsent form={form} />
        {failure === null ? null : <FormMessage tone="error">{failure}</FormMessage>}
        <FormFooter
          mutation={{ isPending: form.formState.isSubmitting }}
          onCancel={onClose}
          submit={{ label: 'Elegir platos', pendingLabel: 'Elegir platos' }}
        />
      </form>
    </FormDialog>
  )
}
