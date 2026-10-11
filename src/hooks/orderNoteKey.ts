/** Clave de una nota: el pedido y el plato, o `pedido` si es la nota del pedido entero. */
export function noteKeyOf(orderId: number, orderItemId: number | null): string {
  return `${String(orderId)}:${orderItemId === null ? 'pedido' : String(orderItemId)}`
}
