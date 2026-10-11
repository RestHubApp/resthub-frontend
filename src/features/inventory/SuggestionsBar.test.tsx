import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { SuggestionsBar } from './SuggestionsBar'

describe('SuggestionsBar', () => {
  it('sin sugerencias, el botón queda bloqueado', () => {
    render(<SuggestionsBar count={0} onLoad={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Cargar sugerencias (0)' })).toBeDisabled()
  })

  it('con sugerencias, las carga al pulsar', async () => {
    const onLoad = jest.fn()
    render(<SuggestionsBar count={3} onLoad={onLoad} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cargar sugerencias (3)' }))

    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})
