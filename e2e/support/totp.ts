// El código de seis dígitos de una aplicación de verificación (RFC 6238), para
// las pruebas de la verificación en dos pasos: la prueba hace de celular.
import { createHmac } from 'node:crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function bytesOf(secret: string): Buffer {
  let bits = ''
  for (const letter of secret.replaceAll(/[\s=]/gu, '').toUpperCase()) {
    bits += ALPHABET.indexOf(letter).toString(2).padStart(5, '0')
  }
  const bytes = bits.match(/.{8}/gu) ?? []
  return Buffer.from(bytes.map((byte) => Number.parseInt(byte, 2)))
}

/** El código vigente, o el de `steps` pasos de 30 s más adelante. */
export function totpCode(secret: string, steps = 0): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + steps))
  const digest = createHmac('sha1', bytesOf(secret)).update(counter).digest()
  const offset = (digest.at(-1) ?? 0) & 0x0f
  const value = digest.readUInt32BE(offset) & 0x7f_ff_ff_ff
  return String(value % 1_000_000).padStart(6, '0')
}
