import { useState } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { useScreenAction } from '@/hooks/useScreenAction'
import { CategorySection } from './CategorySection'
import { MenuHeaderActions } from './MenuHeaderActions'
import { MenuStatus } from './MenuStatus'
import { NewMenuDialogs, type NewMenuDialog } from './NewMenuDialogs'
import { TodaySummary } from './TodaySummary'
import { useMenuData } from './useMenuData'
import { useMenuOrder } from './useMenuOrder'

/** La carta del restaurante: categorías, platos, precios y lo que hay hoy. */
export function MenuView() {
  const { menu, costByDish } = useMenuData()
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
  useScreenAction('nuevo-plato', open({ type: 'plato' }))
  useScreenAction('nueva-categoria', open({ type: 'categoria' }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menú"
        description="Marca cada mañana lo que no hay hoy. Desactivar un plato lo saca de la carta hasta que lo vuelvas a activar."
        actions={
          <MenuHeaderActions
            canAddItem={categories.length > 0}
            onNewCategory={open({ type: 'categoria' })}
            onNewItem={open({ type: 'plato' })}
          />
        }
      />

      <MenuStatus isPending={menu.isPending} error={menu.error} isEmpty={menu.isSuccess && categories.length === 0} />

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
          onAddItem={open({ type: 'plato', categoryId: category.id })}
        />
      ))}

      <NewMenuDialogs dialog={dialog} categories={categories} onClose={close} />
    </div>
  )
}
