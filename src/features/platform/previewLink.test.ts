import { describe, expect, it } from 'vitest'

import { previewUrl } from './previewLink'

describe('previewUrl', () => {
  it('lleva el código en el fragmento, no en la consulta', () => {
    const url = previewUrl('abc123', '/')
    expect(url).toBe('/vista-previa#codigo=abc123')
    expect(url).not.toContain('?')
  })

  it('respeta la base de la aplicación', () => {
    expect(previewUrl('abc', '/app/')).toBe('/app/vista-previa#codigo=abc')
  })

  it('codifica lo que no puede ir tal cual en una dirección', () => {
    expect(previewUrl('a+b/c=&d', '/')).toBe('/vista-previa#codigo=a%2Bb%2Fc%3D%26d')
  })
})
