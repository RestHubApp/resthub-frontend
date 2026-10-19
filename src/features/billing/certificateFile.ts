/** El tope del backend: un .pfx de SUNAT pesa unos pocos KB. */
const MAX_CERTIFICATE_BYTES = 64 * 1024

export const CERTIFICATE_EXTENSIONS = ['.pfx', '.p12', '.pem'] as const

/** Lo que impide subir el archivo, o `null` si sirve. Se revisa antes de leerlo y enviarlo. */
export function certificateFileProblem(file: File | undefined): string | null {
  if (file === undefined) {
    return 'Elige el archivo del certificado.'
  }
  const name = file.name.toLowerCase()
  if (!CERTIFICATE_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return 'El certificado tiene que ser un archivo .pfx, .p12 o .pem.'
  }
  if (file.size === 0) {
    return 'El archivo está vacío.'
  }
  if (file.size > MAX_CERTIFICATE_BYTES) {
    return 'El archivo pesa más de 64 KB: no parece un certificado digital.'
  }
  return null
}

/** El contenido del archivo en base64, leído en el navegador: no pasa por ningún otro lado. */
export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.slice(result.indexOf(',') + 1))
    })
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('No se pudo leer el archivo.'))
    })
    reader.readAsDataURL(file)
  })
}
