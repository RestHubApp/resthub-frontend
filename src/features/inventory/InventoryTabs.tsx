import type { ReactNode } from 'react'

import Icon from '../../components/Icon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { type InventorySection, SECTIONS } from './inventorySections'

interface InventoryTabsProps {
  readonly value: InventorySection
  readonly onChange: (value: InventorySection) => void
  readonly panels: Record<InventorySection, ReactNode>
  /** Cuántas alertas hay, para mostrarlo en la pestaña. */
  readonly alertCount: number | undefined
}

/**
 * Las secciones del inventario en pestañas.
 *
 * En el celular la fila se desplaza de costado en vez de apretar los
 * nombres. Cada pestaña mide lo que un dedo necesita.
 */
export default function InventoryTabs({ value, onChange, panels, alertCount }: InventoryTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(nuevo) => {
        onChange(nuevo as InventorySection)
      }}
      className="gap-4"
    >
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="group-data-horizontal/tabs:h-auto">
          {SECTIONS.map((seccion) => (
            <TabsTrigger key={seccion.value} value={seccion.value} className="h-11 flex-none px-3.5">
              <Icon name={seccion.icon} size={16} />
              <span>{seccion.label}</span>
              {seccion.value === 'alertas' && alertCount !== undefined && alertCount > 0 ? (
                <span className="rounded-full bg-warning px-1.5 text-xs font-semibold text-white">
                  {alertCount}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {SECTIONS.map((seccion) => (
        <TabsContent key={seccion.value} value={seccion.value} className="outline-none">
          {panels[seccion.value]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
