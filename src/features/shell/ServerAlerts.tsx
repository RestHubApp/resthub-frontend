import { AccessAlert } from './AccessAlert'
import { DataAccessAlert } from './DataAccessAlert'

/** Los avisos de seguridad que manda el servidor: muchas fichas abiertas y un acceso desde un lugar nuevo. */
export function ServerAlerts() {
  return (
    <>
      <DataAccessAlert />
      <AccessAlert />
    </>
  )
}
