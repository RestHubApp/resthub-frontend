import { type SyntheticEvent, useId, useState } from 'react'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { customRangeProblem } from './dateRange'

interface CustomRangeFormProps {
  readonly initialFrom: string
  readonly initialTo: string
  readonly max: string
  readonly onApply: (from: string, to: string) => void
}

/** Dos fechas y un botón: el rango se aplica al confirmar, no con cada tecla. */
export default function CustomRangeForm({ initialFrom, initialTo, max, onApply }: CustomRangeFormProps) {
  const [desde, setDesde] = useState(initialFrom)
  const [hasta, setHasta] = useState(initialTo)
  const [problema, setProblema] = useState<string | null>(null)
  const id = useId()

  const aplicar = (event: SyntheticEvent) => {
    event.preventDefault()
    const motivo = customRangeProblem(desde, hasta)
    setProblema(motivo)
    if (motivo === null) {
      onApply(desde, hasta)
    }
  }

  return (
    <form onSubmit={aplicar} noValidate className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-desde`}>Desde</Label>
        <Input id={`${id}-desde`} type="date" value={desde} max={max} onChange={(e) => { setDesde(e.target.value) }} className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-hasta`}>Hasta</Label>
        <Input id={`${id}-hasta`} type="date" value={hasta} max={max} onChange={(e) => { setHasta(e.target.value) }} className="h-9 w-40" />
      </div>
      <Button type="submit" size="lg">Aplicar</Button>
      {problema === null ? null : (
        <p role="alert" className="m-0 w-full text-sm text-destructive">{problema}</p>
      )}
    </form>
  )
}
