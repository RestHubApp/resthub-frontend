import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { montarRutas, servidor } from '#jest/harness'
import type { PreviewEntryResult } from './previewEntry'
import PreviewEntryView from './PreviewEntryView'

function abrirConResultado(resultado: PreviewEntryResult) {
  servidor()
  return montarRutas([{ path: '/vista-previa', loader: () => resultado, Component: PreviewEntryView }], '/vista-previa')
}

describe('PreviewEntryView', () => {
  it('con un código vencido explica el motivo y lleva de vuelta a la administración', async () => {
    abrirConResultado('invalid')

    expect(await screen.findByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeInTheDocument()
    expect(screen.getByText('El código de vista previa no vale: venció (dura un minuto) o ya se usó.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a la administración del sistema' })).toHaveAttribute(
      'href',
      '/plataforma/vista-previa',
    )
  })

  it('sin conexión lo dice con otras palabras', async () => {
    abrirConResultado('offline')

    expect(await screen.findByText('No hubo conexión con el servidor para abrir la vista previa.')).toBeInTheDocument()
  })

  it('mientras recarga la ruta de canje muestra que está abriendo', async () => {
    abrirConResultado('reloading')

    expect(await screen.findByText('Abriendo la vista previa…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No se pudo abrir la vista previa' })).not.toBeInTheDocument()
  })
})
