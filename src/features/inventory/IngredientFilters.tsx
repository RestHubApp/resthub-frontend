import { useId } from 'react'

import { FieldIcon } from '@/components/FieldIcon'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IngredientCount } from './IngredientCount'

interface IngredientFiltersProps {
  readonly search: string
  readonly onSearch: (value: string) => void
  readonly onlyLow: boolean
  readonly onOnlyLow: (value: boolean) => void
  readonly shown: number
  readonly total: number
  /** Cuántos insumos están bajo su mínimo (negativos incluidos). */
  readonly lowCount: number
}

/** Buscar por nombre y quedarse con lo que hay que reponer. */
export function IngredientFilters({
  search,
  onSearch,
  onlyLow,
  onOnlyLow,
  shown,
  total,
  lowCount,
}: IngredientFiltersProps) {
  const searchId = useId()
  const lowId = useId()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2 sm:w-72">
          <Label htmlFor={searchId}>Buscar insumo</Label>
          <FieldIcon icon="search">
            <Input
              id={searchId}
              type="search"
              placeholder="Limón, pollo, aceite…"
              autoComplete="off"
              value={search}
              onChange={(event) => {
                onSearch(event.target.value)
              }}
            />
          </FieldIcon>
        </div>
        <div className="flex min-h-11 items-center gap-2.5">
          <Checkbox
            id={lowId}
            aria-labelledby={`${lowId}-texto`}
            className="size-5"
            checked={onlyLow}
            onCheckedChange={(value) => {
              onOnlyLow(value === true)
            }}
          />
          <Label id={`${lowId}-texto`} htmlFor={lowId} className="cursor-pointer">
            Solo bajo mínimo
          </Label>
        </div>
      </div>
      <IngredientCount shown={shown} total={total} lowCount={lowCount} />
    </div>
  )
}
