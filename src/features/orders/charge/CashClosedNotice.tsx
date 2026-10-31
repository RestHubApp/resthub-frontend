import { FormMessage } from '@/components/FormMessage'
import * as icons from '@/components/icons'

/** Sin caja abierta no se cobra: lo dice antes de que alguien arme el cobro. */
export function CashClosedNotice() {
  return (
    <FormMessage tone="warning" icon={icons.cashRegister} role="alert">
      <span className="font-semibold">La caja está cerrada.</span> El encargado tiene que abrirla en
      «Caja» para poder cobrar.
    </FormMessage>
  )
}
