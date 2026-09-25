import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import DialogFormActions from '../../../components/DialogFormActions'
import FormDialog from '../../../components/FormDialog'
import { textoOpcional } from '../../../components/formRules'
import Icon from '../../../components/Icon'
import TextField from '../../../components/TextField'
import { Button } from '../../../components/ui/button'
import { onSubmit } from '../../../hooks/formSubmit'

const MAX_CLIENTE = 80
const schema = z.object({ customer_name: textoOpcional(MAX_CLIENTE) })
type Values = z.infer<typeof schema>

/**
 * "Para llevar": pide el nombre del cliente y lleva a la toma del pedido.
 *
 * El nombre es opcional pero ayuda a entregar la bolsa correcta cuando hay
 * tres esperando. El pedido no se crea aca, sino al enviarlo a cocina.
 */
export default function TakeawayDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { customer_name: '' },
  })

  const cambiar = (abierto: boolean) => {
    setOpen(abierto)
    if (!abierto) {
      reset()
    }
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="h-11 px-4"
        onClick={() => {
          cambiar(true)
        }}
      >
        <Icon name="llevar" size={18} />
        <span>Para llevar</span>
      </Button>
      <FormDialog open={open} onOpenChange={cambiar} title="Pedido para llevar">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={onSubmit(
            handleSubmit((valores) => {
              const query = new URLSearchParams({ tipo: 'llevar', cliente: valores.customer_name })
              void navigate(`/pedidos/nuevo?${query.toString()}`)
            }),
          )}
        >
          <TextField
            id="takeaway-customer"
            label="Nombre del cliente (opcional)"
            placeholder="Por ejemplo, Ana"
            icon="perfil"
            autoComplete="off"
            maxLength={MAX_CLIENTE}
            hint="Se muestra en el tablero para entregar el pedido correcto."
            field={register('customer_name')}
            error={formState.errors.customer_name?.message}
          />
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
