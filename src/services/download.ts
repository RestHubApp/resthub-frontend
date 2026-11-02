// WebKit (Safari) resuelve la URL de objeto después del clic: revocarla enseguida
// corta la descarga. Se suelta pasado este plazo, para no retener el archivo en memoria.
const REVOKE_AFTER_MS = 40_000

/**
 * Entrega un archivo al navegador como cualquier descarga: un enlace a una URL
 * de objeto que se pulsa y se revoca un rato después.
 */
export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  try {
    link.click()
  } finally {
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, REVOKE_AFTER_MS)
  }
}
