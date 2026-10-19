// Una imagen del API como dirección `data:` que un <img> puede mostrar sin
// pedir permiso a la CSP (`img-src` admite `data:`) y sin direcciones temporales
// que haya que soltar. El tipo se deduce de los primeros bytes: son los mismos
// tres formatos que el servidor acepta.

const SIGNATURES: readonly { readonly type: string; readonly bytes: readonly number[] }[] = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

// btoa recibe texto: se le pasa por tramos para no desbordar la pila con una imagen grande.
const CHUNK = 0x8000

function typeOf(bytes: Uint8Array): string {
  return SIGNATURES.find((signature) => signature.bytes.every((byte, index) => bytes[index] === byte))?.type ?? 'application/octet-stream'
}

export function imageDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK))
  }
  return `data:${typeOf(bytes)};base64,${btoa(binary)}`
}
