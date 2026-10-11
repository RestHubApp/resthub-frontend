import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { OpenOrdersWarning } from './OpenOrdersWarning'

describe('OpenOrdersWarning', () => {
  it('no muestra nada sin pedidos abiertos', () => {
    render(<OpenOrdersWarning count={0} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('usa el singular con un pedido', () => {
    render(<OpenOrdersWarning count={1} />)

    expect(screen.getByRole('status')).toHaveTextContent('Hay 1 pedido sin cobrar')
  })

  it('usa el plural con varios pedidos', () => {
    render(<OpenOrdersWarning count={3} />)

    expect(screen.getByRole('status')).toHaveTextContent('Hay 3 pedidos sin cobrar')
  })
})
