import { useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { CategorySection } from './CategorySection'
import { MenuSkeleton } from './MenuSkeleton'
import { NewMenuDialogs, type NewMenuDialog } from './NewMenuDialogs'
import { TodaySummary } from './TodaySummary'
import { useMenuData } from './useMenuData'
import { useMenuOrder } from './useMenuOrder'

/** La carta del restaurante: categorías, platos, precios y lo que hay hoy. */
export function MenuView() {
  const { menu, costoPorPlato: costByDish } = useMenuData()
  const categories = menu.data?.categories ?? []
  const order = useMenuOrder(categories)
  const [dialog, setDialog] = useState<NewMenuDialog>(null)
  const close = () => {
    setDialog(null)
  }
  const open = (fresh: NewMenuDialog) => () => {
    setDialog(fresh)
  }
  const last = categories.length - 1

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
              onClick={open({ tipo: 'categoria' })}
            >
              <Icon name="agregar" size={16} />
              <span>Nueva categoría</span>
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 px-4"
              disabled={categories.length === 0}
              onClick={open({ tipo: 'plato' })}
            >
              <Icon name="agregar" size={16} />
              <span>Nuevo plato</span>
            </Button>
          </>
        }
      />

      {menu.isPending ? <MenuSkeleton /> : null}
      {menu.isError ? (
        <FormMessage tone="error">
          {errorMessage(menu.error, 'No se pudo cargar la carta.')}
        </FormMessage>
      ) : null}
      {menu.isSuccess && categories.length === 0 ? (
        <EmptyState
          title="La carta está vacía"
          description="Empieza por una categoría, como Entradas o Bebidas, y agrégale sus platos."
        />
      ) : null}

      {categories.length > 0 ? <TodaySummary categories={categories} /> : null}

      {categories.map((category, index) => (
        <CategorySection
          key={category.id}
          category={category}
          categories={categories}
          costs={costByDish}
          isFirst={index === 0}
          isLast={index === last}
          onMoveCategory={(direction) => {
            order.moveCategory(category.id, direction)
          }}
          onMoveItem={(itemId, direction) => {
            order.moveItem(category, itemId, direction)
          }}
          onAddItem={open({ tipo: 'plato', categoryId: category.id })}
        />
      ))}

      <NewMenuDialogs dialog={dialog} categories={categories} onClose={close} />
    </div>
  )
}
