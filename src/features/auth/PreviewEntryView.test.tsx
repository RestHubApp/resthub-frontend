import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountRoutes, server } from '#jest/harness'
import type { PreviewEntryResult } from './previewEntry'
import { PreviewEntryView } from './PreviewEntryView'

function openWithResult(result: PreviewEntryResult) {
  server()
  return mountRoutes([{ path: '/vista-previa', loader: () => result, Component: PreviewEntryView }], '/vista-previa')
}

describe('PreviewEntryView', () => {
  it('con un código vencido explica el motivo y lleva de vuelta a la administración', async () => {
    openWithResult('invalid')

    expect(await screen.findByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('El código de vista previa no vale: venció (dura un minuto) o ya se usó.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a la administración del sistema' })).toHaveAttribute(
      'href',
      '/plataforma/vista-previa',
    )
  })

  it('sin conexión lo dice con otras palabras', async () => {
    openWithResult('offline')

    expect(await screen.findByRole('alert')).toHaveTextContent('No hubo conexión con el servidor para abrir la vista previa.')
  })

  it('mientras recarga la ruta de canje muestra que está abriendo', async () => {
    openWithResult('reloading')

    expect(await screen.findByText('Abriendo la vista previa…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No se pudo abrir la vista previa' })).not.toBeInTheDocument()
  })
})
