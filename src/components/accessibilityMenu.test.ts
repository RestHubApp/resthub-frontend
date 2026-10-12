import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { openAccessibilityMenu } from './accessibilityMenu'

function widgetButton(): { button: HTMLAnchorElement; click: jest.Mock } {
  const button = document.createElement('a')
  button.className = 'asw-menu-btn'
  const click = jest.fn()
  button.addEventListener('click', click)
  return { button, click }
}

describe('openAccessibilityMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('con el widget ya cargado, toca su botón', () => {
    const { button, click } = widgetButton()
    document.body.append(button)

    openAccessibilityMenu()

    expect(click).toHaveBeenCalledTimes(1)
  })

  it('si el widget todavía no cargó, lo carga y abre el menú cuando aparece su botón', async () => {
    const { button, click } = widgetButton()

    openAccessibilityMenu()
    expect(click).not.toHaveBeenCalled()
    // El widget dibuja su botón un momento después de importarse.
    window.setTimeout(() => {
      document.body.append(button)
    }, 120)

    await waitFor(() => {
      expect(click).toHaveBeenCalledTimes(1)
    })
  })
})
