interface ReadOnlyFieldProps {
  readonly label: string
  readonly value: string
  readonly hint: string
}

/**
 * Un dato que se muestra en el formulario pero no se edita.
 *
 * Va como texto y no como un campo deshabilitado: un campo gris invita a
 * tocarlo, el lector de pantalla lo anuncia como "no disponible" sin decir por
 * que, y react-hook-form no envia su valor.
 */
export default function ReadOnlyField({ label, value, hint }: ReadOnlyFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-sm font-medium">{label}</p>
      <p className="m-0 flex min-h-10 items-center text-base break-all">{value}</p>
      <p className="m-0 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
