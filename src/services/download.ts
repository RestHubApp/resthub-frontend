/**
 * Entrega un archivo al navegador como cualquier descarga: un enlace a una URL
 * de objeto que se pulsa y se revoca enseguida, para no retener el archivo en memoria.
 */
export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  try {
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
