import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { FullscreenButton } from './FullscreenButton'

// jsdom no trae la API de pantalla completa: se arma una que se comporta como la del navegador.
const state: { element: Element | null } = { element: null }
const ENTER = 'Pantalla completa'
const EXIT = 'Salir de pantalla completa'
const TITLE = 'title'
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
    expect(button).toHaveAttribute(TITLE, ENTER)

    await user.click(button)
    expect(request).toHaveBeenCalledTimes(1)
    // El nombre se queda fijo; el estado lo dice aria-pressed y el tooltip cambia.
    expect(button).toHaveAccessibleName(ENTER)
    expect(button).toHaveAttribute(PRESSED, 'true')
    expect(button).toHaveAttribute(TITLE, EXIT)
    expect(screen.queryByRole('button', { name: EXIT })).not.toBeInTheDocument()

    await user.click(button)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(button).toHaveAttribute(PRESSED, 'false')
    expect(button).toHaveAttribute(TITLE, ENTER)
  })

  it('refleja la salida con Esc, que el navegador avisa con fullscreenchange', () => {
    stubFullscreen(true)
    render(<FullscreenButton />)

    const button = screen.getByRole('button', { name: ENTER, pressed: false })
    act(enter)
    expect(screen.getByRole('button', { name: ENTER, pressed: true })).toBe(button)
    act(exit)
    expect(screen.getByRole('button', { name: ENTER, pressed: false })).toBe(button)
  })

  it('no aparece donde la página no puede pedirla (iPhone, PWA)', () => {
    stubFullscreen(false)
    render(<FullscreenButton />)

    expect(screen.queryByRole('button', { name: /pantalla completa/iu })).not.toBeInTheDocument()
  })
})
