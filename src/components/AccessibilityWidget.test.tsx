import { describe, expect, it } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'

import { AccessibilityWidget } from './AccessibilityWidget'

const OPEN = { name: 'Abrir menú de accesibilidad' }

describe('AccessibilityWidget', () => {
  it('ofrece un botón propio sin descargar el widget', () => {
    render(<AccessibilityWidget />)

    expect(screen.getByRole('button', OPEN)).toHaveAttribute('aria-expanded', 'false')
  })

  it('retira su botón cuando el widget dibuja el suyo', async () => {
    render(<AccessibilityWidget />)
    const widgetButton = document.createElement('a')
    widgetButton.className = 'asw-menu-btn'

    await act(async () => {
      document.body.append(widgetButton)
      await Promise.resolve()
    })

    expect(screen.queryByRole('button', OPEN)).not.toBeInTheDocument()
    widgetButton.remove()
  })

  it('si el widget ya estaba cargado no muestra el botón de reserva', () => {
    const widgetButton = document.createElement('a')
    widgetButton.className = 'asw-menu-btn'
    document.body.append(widgetButton)
    render(<AccessibilityWidget />)

    expect(screen.queryByRole('button', OPEN)).not.toBeInTheDocument()
    widgetButton.remove()
  })
})
