import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import { photoProblem, preparePhoto } from './dishPhotoFile'

const JPEG = 'image/jpeg'
const PNG = 'image/png'
const WEBP = 'image/webp'
const LIMIT = 350 * 1024

function file(type: string, size: number, name = 'plato'): File {
  return new File([new Uint8Array(size)], name, { type })
}

describe('photoProblem', () => {
  it('acepta JPEG, PNG y WebP', () => {
    expect(photoProblem(file(JPEG, 10))).toBeNull()
    expect(photoProblem(file(PNG, 10))).toBeNull()
    expect(photoProblem(file(WEBP, 10))).toBeNull()
  })

  it('rechaza lo que no es una imagen que el servidor acepte', () => {
    expect(photoProblem(undefined)).toBe('Elige una foto.')
    expect(photoProblem(file('image/gif', 10))).toMatch(/JPEG, PNG o WebP/u)
    expect(photoProblem(file('application/pdf', 10))).toMatch(/JPEG, PNG o WebP/u)
  })

  it('rechaza el archivo vacío y el demasiado grande', () => {
    expect(photoProblem(file(PNG, 0))).toBe('El archivo está vacío.')
    expect(photoProblem(file(PNG, 16 * 1024 * 1024))).toMatch(/15 MB/u)
  })
})

describe('preparePhoto', () => {
  const close = jest.fn()
  const drawImage = jest.fn()
  const fillRect = jest.fn()
  let bitmap = { width: 3000, height: 2000, close }
  let sizeFor: (type: string, quality: number, width: number) => number
  let canvases: HTMLCanvasElement[]

  beforeEach(() => {
    bitmap = { width: 3000, height: 2000, close }
    canvases = []
    sizeFor = () => 1000
    Object.assign(globalThis, { createImageBitmap: jest.fn(() => Promise.resolve(bitmap)) })
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      canvases.push(this)
      return { drawImage, fillRect, fillStyle: '' } as unknown as CanvasRenderingContext2D
    })
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      type?: string,
      quality?: unknown,
    ) {
      callback(new Blob([new Uint8Array(sizeFor(type ?? '', Number(quality), this.width))], { type: type ?? PNG }))
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    close.mockClear()
    drawImage.mockClear()
    fillRect.mockClear()
  })

  it('reduce la foto a 800 px de lado y la devuelve en base64', async () => {
    const result = await preparePhoto(file(JPEG, 10))

    expect(canvases[0]?.width).toBe(800)
    expect(canvases[0]?.height).toBe(533)
    expect(atob(result)).toHaveLength(1000)
    expect(fillRect).toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('no agranda una foto que ya es pequeña', async () => {
    bitmap = { width: 400, height: 300, close }

    await preparePhoto(file(PNG, 10))

    expect(canvases[0]?.width).toBe(400)
    expect(canvases[0]?.height).toBe(300)
  })

  it('si el navegador no escribe WebP, usa JPEG', async () => {
    const types: string[] = []
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => {
      types.push(type ?? '')
      callback(new Blob([new Uint8Array(10)], { type: (type === WEBP ? PNG : type) ?? '' }))
    })

    await preparePhoto(file(PNG, 10))

    expect(types).toEqual([WEBP, JPEG])
  })

  it('baja la calidad y luego el tamaño hasta que cabe', async () => {
    sizeFor = (_type, quality, width) => {
      const isTooBig = width === 800 || quality > 0.5
      return isTooBig ? LIMIT + 1 : 100
    }

    await preparePhoto(file(JPEG, 10))

    const widths = canvases.map((canvas) => canvas.width)
    expect(widths).toEqual([800, 600])
  })

  it('falla si ni reducida llega a pesar poco', async () => {
    sizeFor = () => 10 * 1024 * 1024

    await expect(preparePhoto(file(JPEG, 10))).rejects.toThrow('demasiado pesada')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('falla si el navegador no puede dibujar', async () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    await expect(preparePhoto(file(JPEG, 10))).rejects.toThrow('no pudo preparar')
  })
})
