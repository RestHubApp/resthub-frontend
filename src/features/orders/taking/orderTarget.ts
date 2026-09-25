/** A donde va lo que se esta marcando: una mesa, un pedido para llevar o un pedido existente. */
export type OrderTarget =
  | { readonly kind: 'table'; readonly tableId: number }
  | { readonly kind: 'takeaway'; readonly customerName: string }
  | { readonly kind: 'add'; readonly orderId: number }

/** La clave del borrador: cada mesa y cada pedido tiene el suyo. */
export function draftKey(target: OrderTarget): string {
  switch (target.kind) {
    case 'table':
      return `mesa-${String(target.tableId)}`
    case 'takeaway':
      return 'llevar'
    case 'add':
      return `pedido-${String(target.orderId)}`
  }
}

/** A donde vuelve "Atras". */
export function backPath(target: OrderTarget): string {
  if (target.kind === 'add') {
    return `/pedidos/${String(target.orderId)}`
  }
  return target.kind === 'takeaway' ? '/pedidos?vista=llevar' : '/pedidos'
}
