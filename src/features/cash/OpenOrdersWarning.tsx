interface OpenOrdersWarningProps {
  /** Pedidos que siguen sin cobrar al cerrar. */
  readonly count: number
}

/** Aviso de pedidos sin cobrar al cerrar la caja; con cero no se muestra. */
export function OpenOrdersWarning({ count }: OpenOrdersWarningProps) {
  if (count <= 0) {
    return null
  }

  return (
    <p role="status" className="m-0 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
      {count === 1 ? 'Hay 1 pedido sin cobrar' : `Hay ${String(count)} pedidos sin cobrar`}.
      Puedes cerrar igual: se cobra en el turno siguiente.
    </p>
  )
}
