import type { Supplier } from '@/api/types'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

interface SupplierSelectProps {
  /** Los proveedores activos entre los que se elige. */
  readonly suppliers: readonly Supplier[]
  readonly value: string
  readonly onChange: (value: string) => void
}

/** El proveedor al que se le hace la orden. */
export function SupplierSelect({ suppliers, value, onChange }: SupplierSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="orden-proveedor">Proveedor</Label>
      <NativeSelect
        id="orden-proveedor"
        className="w-full"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      >
        <NativeSelectOption value="">
          {suppliers.length === 0 ? 'Da de alta un proveedor primero' : 'Elige el proveedor'}
        </NativeSelectOption>
        {suppliers.map((supplier) => (
          <NativeSelectOption key={supplier.id} value={String(supplier.id)}>{supplier.name}</NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
