import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SearchBoxProps {
  readonly value: string
  readonly onChange: (value: string) => void
}

/** La busqueda rapida de platos. La etiqueta se oye aunque no se vea. */
export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="relative">
      <Label htmlFor="buscar-plato" className="sr-only">
        Buscar plato
      </Label>
      <Icon
        glyph={icons.search}
        size={18}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="buscar-plato"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Buscar plato…"
        className="h-12 bg-card pl-10 text-base"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
    </div>
  )
}
