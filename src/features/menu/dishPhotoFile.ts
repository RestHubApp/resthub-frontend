// Prepara la foto de un plato en el navegador antes de subirla: la reduce y la
// vuelve a codificar. Así pesa unas decenas de KB aunque venga de una cámara de
// 12 megapíxeles, el servidor nunca recibe el original y se pierden los datos
// de la foto (ubicación, fecha, modelo del celular).

/** Lo más grande que se acepta elegir; la foto que se sube es mucho menor. */
const MAX_SOURCE_BYTES = 15 * 1024 * 1024
/** Menos que el tope del servidor (400 KB), para dejar margen al base64 y a los cambios de tope. */
const MAX_UPLOAD_BYTES = 350 * 1024
const MAX_SIDE = 800
const QUALITIES = [0.82, 0.7, 0.55, 0.4] as const
const SHRINK = 0.75
const MAX_SHRINKS = 3

const JPEG = 'image/jpeg'
const WEBP = 'image/webp'

export const PHOTO_TYPES = [JPEG, 'image/png', WEBP] as const

/** Lo que impide usar el archivo como foto, o `null` si sirve. */
export function photoProblem(file: File | undefined): string | null {
  if (file === undefined) {
    return 'Elige una foto.'
  }
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return 'La foto tiene que ser una imagen JPEG, PNG o WebP.'
  }
  if (file.size === 0) {
    return 'El archivo está vacío.'
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return 'La foto pesa más de 15 MB. Elige una más pequeña.'
  }
  return null
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

/** WebP si el navegador lo sabe escribir; si no, devuelve PNG y se usa JPEG. */
async function encodeSmall(canvas: HTMLCanvasElement): Promise<Blob | null> {
  for (const quality of QUALITIES) {
    let blob = await encode(canvas, WEBP, quality)
    if (blob?.type !== WEBP) {
      blob = await encode(canvas, JPEG, quality)
    }
    if (blob !== null && blob.size <= MAX_UPLOAD_BYTES) {
      return blob
    }
  }
  return null
}

function drawn(bitmap: ImageBitmap, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('El navegador no pudo preparar la foto.')
  }
  // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG.
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** El contenido en base64, leído en el navegador. */
function base64Of(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.slice(result.indexOf(',') + 1))
    })
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('No se pudo leer la foto.'))
    })
    reader.readAsDataURL(blob)
  })
}

/** La foto reducida a 800 px de lado como máximo, en base64 y lista para subir. */
export async function preparePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    for (let attempt = 0; attempt <= MAX_SHRINKS; attempt += 1) {
      const blob = await encodeSmall(drawn(bitmap, scale))
      if (blob !== null) {
        return await base64Of(blob)
      }
      scale *= SHRINK
    }
  } finally {
    bitmap.close()
  }
  throw new Error('La foto es demasiado pesada aun reducida.')
}
