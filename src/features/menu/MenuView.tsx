import { useState } from 'react'

import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import CategorySection from './CategorySection'
import NewMenuDialogs, { type NewMenuDialog } from './NewMenuDialogs'
import TodaySummary from './TodaySummary'
import { useMenuData } from './useMenuData'
import { useMenuOrder } from './useMenuOrder'

/** La carta del restaurante: categorías, platos, precios y lo que hay hoy. */
export default function MenuView() {
  const { menu, costoPorPlato } = useMenuData()
  const categorias = menu.data?.categories ?? []
  const orden = useMenuOrder(categorias)
  const [dialogo, setDialogo] = useState<NewMenuDialog>(null)
  const cerrar = () => {
    setDialogo(null)
  }
  const abrir = (nuevo: NewMenuDialog) => () => {
    setDialogo(nuevo)
  }
  const ultima = categorias.length - 1

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menú"
        description="Marca cada mañana lo que no hay hoy. Desactivar un plato lo saca de la carta hasta que lo vuelvas a activar."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 px-4"
              onClick={abrir({ tipo: 'categoria' })}
            >
              <Icon name="agregar" size={16} />
              <span>Nueva categoría</span>
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 px-4"
              disabled={categorias.length === 0}
              onClick={abrir({ tipo: 'plato' })}
            >
              <Icon name="agregar" size={16} />
              <span>Nuevo plato</span>
            </Button>
          </>
        }
      />

      {menu.isPending ? <EmptyState title="Cargando la carta…" /> : null}
      {menu.isError ? (
        <FormMessage tone="error">
          {errorMessage(menu.error, 'No se pudo cargar la carta.')}
        </FormMessage>
      ) : null}
      {menu.isSuccess && categorias.length === 0 ? (
        <EmptyState
          title="La carta está vacía"
          description="Empieza por una categoría, como Entradas o Bebidas, y agrégale sus platos."
        />
      ) : null}

      {categorias.length > 0 ? <TodaySummary categories={categorias} /> : null}

      {categorias.map((categoria, indice) => (
        <CategorySection
          key={categoria.id}
          category={categoria}
          categories={categorias}
          costs={costoPorPlato}
          isFirst={indice === 0}
          isLast={indice === ultima}
          onMoveCategory={(direction) => {
            orden.moveCategory(categoria.id, direction)
          }}
          onMoveItem={(itemId, direction) => {
            orden.moveItem(categoria, itemId, direction)
          }}
          onAddItem={abrir({ tipo: 'plato', categoryId: categoria.id })}
        />
      ))}

      <NewMenuDialogs dialog={dialogo} categories={categorias} onClose={cerrar} />
    </div>
  )
}
