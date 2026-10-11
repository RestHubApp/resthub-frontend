import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { RoleFormFooter } from './RoleFormFooter'

const BASE = { readOnly: false, isError: false, error: null, isPending: false, failureText: 'Falló', onDone: () => undefined }

describe('RoleFormFooter', () => {
  it('en solo lectura ofrece únicamente cerrar', () => {
    render(<RoleFormFooter {...BASE} readOnly />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument()
  })

  it('mientras guarda deshabilita el botón y cambia su texto', () => {
    render(<RoleFormFooter {...BASE} isPending />)
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })

  it('muestra el error del envío', () => {
    render(<RoleFormFooter {...BASE} isError />)
    expect(screen.getByText('Falló')).toBeInTheDocument()
  })
})
