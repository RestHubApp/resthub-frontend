import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { noticesChannel } from '#jest/channel'
import { mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { AccessAlert } from './AccessAlert'

describe('AccessAlert (RFS-16)', () => {
  it('avisa del acceso desde un dispositivo o país nuevo y lleva a los accesos', async () => {
    server()
    const channel = noticesChannel()
    signInAs(PERMISSIONS_WAITER)
    const { user } = mountScreen(<AccessAlert />)
    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })

    channel.issue('access_alert', '{"id":3}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Alguien entró desde un dispositivo o un país nuevo.')
    expect(screen.getByRole('link', { name: 'Ver mis accesos' })).toHaveAttribute('href', '/perfil')
    expect(screen.queryByRole('link', { name: 'Ver el personal' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('a quien administra al personal también lo lleva a Personal', async () => {
    server()
    const channel = noticesChannel()
    signInAs(PERMISSIONS_OWNER)
    mountScreen(<AccessAlert />)
    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })

    channel.issue('access_alert', '{"id":4}')

    expect(await screen.findByRole('link', { name: 'Ver el personal' })).toHaveAttribute('href', '/personal')
  })

  it('la vista previa no escucha el canal', () => {
    server()
    const channel = noticesChannel()
    signInAs(PERMISSIONS_WAITER, { preview: true })
    mountScreen(<AccessAlert />)

    expect(channel.connections).toHaveLength(0)
  })
})
