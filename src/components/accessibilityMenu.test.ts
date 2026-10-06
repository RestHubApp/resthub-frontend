import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { openAccessibilityMenu } from './accessibilityMenu'

function botonDelWidget(): { boton: HTMLAnchorElement; clic: jest.Mock } {
  const boton = document.createElement('a')
  boton.className = 'asw-menu-btn'
  const clic = jest.fn()
  boton.addEventListener('click', clic)
  return { boton, clic }
}

describe('openAccessibilityMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('con el widget ya cargado, toca su botón', () => {
    const { boton, clic } = botonDelWidget()
    document.body.append(boton)

    openAccessibilityMenu()

    expect(clic).toHaveBeenCalledTimes(1)
  })

  it('si el widget todavía no cargó, lo carga y abre el menú cuando aparece su botón', async () => {
    const { boton, clic } = botonDelWidget()

    openAccessibilityMenu()
    expect(clic).not.toHaveBeenCalled()
    // El widget dibuja su botón un momento después de importarse.
    window.setTimeout(() => {
      document.body.append(boton)
    }, 120)

    await waitFor(() => {
      expect(clic).toHaveBeenCalledTimes(1)
    })
  })
})
