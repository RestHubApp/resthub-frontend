import { afterEach, describe, expect, it } from '@jest/globals'

import { useNotifications } from './notifications'

afterEach(() => {
  useNotifications.setState({ toasts: [] })
})

describe('avisos en pantalla', () => {
  it('se apilan en orden, cada uno con su id', () => {
    const { push } = useNotifications.getState()
    push({ tone: 'info', message: 'Caja abierta' })
    push({ tone: 'warning', message: 'Sin señal' })

    const notices = useNotifications.getState().toasts
    expect(notices.map((a) => a.message)).toEqual(['Caja abierta', 'Sin señal'])
    expect(new Set(notices.map((a) => a.id)).size).toBe(2)
  })

  it('descartar quita solo ese aviso', () => {
    const { push } = useNotifications.getState()
    push({ tone: 'info', message: 'Uno' })
    push({ tone: 'info', message: 'Dos' })
    const first = useNotifications.getState().toasts.at(0)

    useNotifications.getState().dismiss(first?.id ?? '')

    expect(useNotifications.getState().toasts.map((a) => a.message)).toEqual(['Dos'])
  })
})
