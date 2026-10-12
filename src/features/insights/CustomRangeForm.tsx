import { type SyntheticEvent, useId, useState } from 'react'

import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { customRangeProblem } from './dateRange'

interface CustomRangeFormProps {
  readonly initialFrom: string
  readonly initialTo: string
  readonly max: string
  readonly onApply: (from: string, to: string) => void
}

/** Dos fechas y un botón: el rango se aplica al confirmar, no con cada tecla. */
export function CustomRangeForm({ initialFrom, initialTo, max, onApply }: CustomRangeFormProps) {
  const [from, setFrom] = useState(initialFrom)
  const [until, setUntil] = useState(initialTo)
  const [problem, setProblem] = useState<string | null>(null)
  const id = useId()

  const apply = (event: SyntheticEvent) => {
    event.preventDefault()
    const reason = customRangeProblem(from, until)
    setProblem(reason)
    if (reason === null) {
      onApply(from, until)
    }
  }

  return (
    <form onSubmit={apply} noValidate className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-desde`}>Desde</Label>
        <Input id={`${id}-desde`} type="date" value={from} max={max} onChange={(e) => { setFrom(e.target.value) }} className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-hasta`}>Hasta</Label>
        <Input id={`${id}-hasta`} type="date" value={until} max={max} onChange={(e) => { setUntil(e.target.value) }} className="h-9 w-40" />
      </div>
      <Button type="submit" size="lg">Aplicar</Button>
      {problem === null ? null : (
        <div className="w-full"><FormMessage tone="error">{problem}</FormMessage></div>
      )}
    </form>
  )
}
