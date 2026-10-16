import { useState } from 'react'

import { FormFooter } from '@/components/FormFooter'
import { FormMessage } from '@/components/FormMessage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InventoryFailure } from '@/features/inventory/InventoryFailure'
import { useIngredients } from '@/features/inventory/useIngredients'
import { IngredientPicker } from './IngredientPicker'
import { ScopeChoice, type CountScope } from './ScopeChoice'
import { useStartCount } from './useStartCount'

const MAX_NOTE = 300

/** Qué se cuenta (el inventario entero o algunos insumos) y una nota opcional, como «Cierre de mes». */
export function StartCountForm({ onCancel }: { readonly onCancel: () => void }) {
  const ingredients = useIngredients()
  const [scope, setScope] = useState<CountScope>('all')
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [note, setNote] = useState('')
  const [isMissing, setIsMissing] = useState(false)
  const start = useStartCount()
  const toggle = (ingredientId: number) => {
    const next = new Set(selected)
    if (!next.delete(ingredientId)) {
      next.add(ingredientId)
    }
    setSelected(next)
    setIsMissing(false)
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (scope === 'selected' && selected.size === 0) {
          setIsMissing(true)
          return
        }
        start.mutate({ scope, ingredient_ids: scope === 'all' ? [] : [...selected], note: note.trim() })
      }}
    >
      <ScopeChoice value={scope} onChange={setScope} total={ingredients.data?.length ?? 0} />
      {scope === 'selected' ? <IngredientPicker ingredients={ingredients.data ?? []} selected={selected} onToggle={toggle} /> : null}
      {isMissing ? <FormMessage tone="error">Elige al menos un insumo para contar.</FormMessage> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="conteo-nota">Nota (opcional)</Label>
        <Input id="conteo-nota" maxLength={MAX_NOTE} placeholder="Cierre de mes, barra…" value={note} onChange={(event) => { setNote(event.target.value) }} />
      </div>
      <InventoryFailure mutation={start} fallback="No se pudo iniciar el conteo." />
      <FormFooter mutation={start} onCancel={onCancel} submit={{ label: 'Iniciar conteo', icon: 'count' }} />
    </form>
  )
}
