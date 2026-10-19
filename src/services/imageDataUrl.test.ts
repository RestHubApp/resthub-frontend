import { describe, expect, it } from '@jest/globals'

import { imageDataUrl } from './imageDataUrl'

function buffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}

describe('imageDataUrl', () => {
  it('reconoce JPEG, PNG y WebP por sus primeros bytes', () => {
    expect(imageDataUrl(buffer(0xff, 0xd8, 0xff, 0xe0))).toMatch(/^data:image\/jpeg;base64,/u)
    expect(imageDataUrl(buffer(0x89, 0x50, 0x4e, 0x47, 0x0d))).toMatch(/^data:image\/png;base64,/u)
    expect(imageDataUrl(buffer(0x52, 0x49, 0x46, 0x46, 0x00))).toMatch(/^data:image\/webp;base64,/u)
  })

  it('un contenido desconocido no se hace pasar por imagen', () => {
    expect(imageDataUrl(buffer(1, 2, 3))).toMatch(/^data:application\/octet-stream;base64,/u)
  })

  it('codifica los bytes en base64, también los de una imagen grande', () => {
    expect(imageDataUrl(buffer(0xff, 0xd8, 0xff))).toBe('data:image/jpeg;base64,/9j/')
    const big = new Uint8Array(100_000).fill(7)

    expect(atob(imageDataUrl(big.buffer).split(',')[1] ?? '')).toHaveLength(100_000)
  })
})
