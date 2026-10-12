/** El id del botón «⋯» de una pantalla del menú, para devolverle el foco cuando la fila cambia de lugar. */
export function menuActionsId(path: string): string {
  return `menu-actions-${path}`
}
