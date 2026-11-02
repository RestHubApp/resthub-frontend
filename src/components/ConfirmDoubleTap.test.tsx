import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfirmDialog } from './ConfirmDialog'

const realComputedStyle = window.getComputedStyle.bind(window)

// jsdom no anima: la ventana dice que tiene una animación de salida y, como
// nunca llega `animationend`, sigue montada mientras se cierra, igual que en
// los 100 ms del navegador.
function animateExit() {
  jest.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const styles = realComputedStyle(element, pseudo)
    if (element.getAttribute('data-slot') !== 'alert-dialog-content') return styles
    return new Proxy(styles, {
      get: (target, key) => {
        if (key === 'animationName') return element.getAttribute('data-state') === 'closed' ? 'exit' : 'enter'
        const value: unknown = Reflect.get(target, key)
        return typeof value === 'function' ? (value as () => unknown).bind(target) : value
      },
    })
  })
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ConfirmDialog: doble toque', () => {
  it('un doble clic en la confirmación la dispara una sola vez', async () => {
    animateExit()
    const onConfirm = jest.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        trigger={<button type="button">Aprobar</button>}
        title="¿Aprobar la merma?"
        description="Se descuenta del stock."
        confirmLabel="Aprobar merma"
        confirmVariant="default"
        onConfirm={onConfirm}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Aprobar' }))

    await user.dblClick(await screen.findByRole('button', { name: 'Aprobar merma' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
