import Icon from '../../../components/Icon'

/** Sin caja abierta no se cobra: lo dice antes de que alguien arme el cobro. */
export default function CashClosedNotice() {
  return (
    <p role="alert" className="m-0 flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
      <Icon name="caja" size={18} />
      <span>
        <span className="font-semibold">La caja está cerrada.</span> El encargado tiene que abrirla en
        «Caja» para poder cobrar.
      </span>
    </p>
  )
}
