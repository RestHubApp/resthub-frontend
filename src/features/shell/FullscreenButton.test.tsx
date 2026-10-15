import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { FullscreenButton } from './FullscreenButton'

// jsdom no trae la API de pantalla completa: se arma una que se comporta como la del navegador.
const state: { element: Element | null } = { element: null }
const ENTER = 'Pantalla completa'
const EXIT = 'Salir de pantalla completa'
const PRESSED = 'aria-pressed'

function enter() {
  state.element = document.documentElement
  document.dispatchEvent(new Event('fullscreenchange'))
}

function exit() {
  state.element = null
  document.dispatchEvent(new Event('fullscreenchange'))
}

function stubFullscreen(isEnabled: boolean) {
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: isEnabled })
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => state.element })
  const request = jest.fn(() => {
    enter()
    return Promise.resolve()
  })
  const leave = jest.fn(() => {
    exit()
    return Promise.resolve()
  })
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: request })
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: leave })
  return { request, leave }
}

beforeEach(() => {
  state.element = null
})

afterEach(() => {
  for (const key of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen'] as const) {
    Reflect.deleteProperty(document, key)
  }
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
})

describe('FullscreenButton', () => {
  it('pide la pantalla completa y, ya adentro, ofrece salir', async () => {
    const { request, leave } = stubFullscreen(true)
    render(<FullscreenButton />)
    const user = userEvent.setup()

    const button = screen.getByRole('button', { name: ENTER })
    expect(button).toHaveAttribute(PRESSED, 'false')
    expect(button).toHaveAttribute('title', ENTER)

    await user.click(button)
    expect(request).toHaveBeenCalledTimes(1)
    const exitButton = screen.getByRole('button', { name: EXIT })
    expect(exitButton).toHaveAttribute(PRESSED, 'true')

    await user.click(exitButton)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: ENTER })).toHaveAttribute(PRESSED, 'false')
  })

  it('refleja la salida con Esc, que el navegador avisa con fullscreenchange', () => {
    stubFullscreen(true)
    render(<FullscreenButton />)

    act(enter)
    expect(screen.getByRole('button', { name: EXIT })).toBeInTheDocument()
    act(exit)
    expect(screen.getByRole('button', { name: ENTER })).toBeInTheDocument()
  })

  it('no aparece donde la página no puede pedirla (iPhone, PWA)', () => {
    stubFullscreen(false)
    render(<FullscreenButton />)

    expect(screen.queryByRole('button', { name: /pantalla completa/iu })).not.toBeInTheDocument()
  })
})
