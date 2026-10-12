import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { noticesChannel } from '#jest/channel'
import { mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import { DataAccessAlert } from './DataAccessAlert'

const ALERT = 'Alguien abrió muchas fichas de clientes en poco tiempo.'

describe('DataAccessAlert', () => {
  it('avisa a quien ve la bitácora y lleva a los accesos, y se puede descartar', async () => {
    server()
    const channel = noticesChannel()
    signInAs(PERMISSIONS_OWNER)
    const { user } = mountScreen(<DataAccessAlert />)
    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    channel.issue('dlp_alert', '{"id":9}')

    expect(await screen.findByRole('alert')).toHaveTextContent(ALERT)
    expect(screen.getByRole('link', { name: 'Ver en la bitácora' })).toHaveAttribute('href', '/bitacora?filtro=accesos')
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sin el permiso de la bitácora no escucha el canal', () => {
    server()
    const channel = noticesChannel()
    signInAs(PERMISSIONS_WAITER)
    mountScreen(<DataAccessAlert />)

    expect(channel.connections).toHaveLength(0)
  })
})
