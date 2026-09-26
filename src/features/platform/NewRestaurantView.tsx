import { useNavigate } from 'react-router'

import BackLink from '../../components/BackLink'
import PageHeader from '../../components/PageHeader'
import NewRestaurantForm from './NewRestaurantForm'

/** Dar de alta un restaurante. Al crearlo se abre su ficha, con lo que devolvió el servidor. */
export default function NewRestaurantView() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/plataforma" label="Restaurantes" />
      <PageHeader
        title="Nuevo restaurante"
        description="El local, su zona horaria y la cuenta de quien lo va a administrar."
      />
      <NewRestaurantForm
        onCreated={(restaurante) => {
          void navigate(`/plataforma/restaurantes/${String(restaurante.id)}`, {
            replace: true,
            state: { created: true },
          })
        }}
        onCancel={() => {
          void navigate('/plataforma')
        }}
      />
    </div>
  )
}
