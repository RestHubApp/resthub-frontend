import { createExpandedRowModel, rowExpandingFeature, tableFeatures } from '@tanstack/react-table'

/** Funciones de TanStack Table que usan todas las tablas: filas desplegables. */
export const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
})
