import { useId } from 'react'

import FieldIcon from '../../components/FieldIcon'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface IngredientFiltersProps {
  readonly search: string
  readonly onSearch: (value: string) => void
  readonly onlyLow: boolean
  readonly onOnlyLow: (value: boolean) => void
  readonly shown: number
  readonly total: number
}

/** Buscar por nombre y quedarse con lo que hay que reponer. */
export default function IngredientFilters({
  search,
  onSearch,
  onlyLow,
  onOnlyLow,
  shown,
  total,
}: IngredientFiltersProps) {
  const buscarId = useId()
  const bajosId = useId()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2 sm:w-72">
          <Label htmlFor={buscarId}>Buscar insumo</Label>
          <FieldIcon icon="buscar">
            <Input
              id={buscarId}
              type="search"
              className="h-11"
              placeholder="Limón, pollo, aceite…"
              autoComplete="off"
              value={search}
              onChange={(evento) => {
                onSearch(evento.target.value)
              }}
            />
          </FieldIcon>
        </div>
        <div className="flex min-h-11 items-center gap-2.5">
          <Checkbox
            id={bajosId}
            className="size-5"
            checked={onlyLow}
            onCheckedChange={(valor) => {
              onOnlyLow(valor === true)
            }}
          />
          <Label htmlFor={bajosId} className="cursor-pointer">
            Solo bajo mínimo
          </Label>
        </div>
      </div>
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {shown === total ? `${String(total)} insumos` : `${String(shown)} de ${String(total)} insumos`}
      </p>
    </div>
  )
}
