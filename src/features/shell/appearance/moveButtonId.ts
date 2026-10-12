/** El id del botón de subir o bajar una pantalla, para devolverle el foco cuando la fila cambia de lugar. */
export function moveButtonId(path: string, step: -1 | 1): string {
  return `move-${step === -1 ? 'up' : 'down'}-${path}`
}
