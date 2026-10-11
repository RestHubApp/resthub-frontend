interface FieldHintProps {
  readonly id: string
  readonly hint?: string | undefined
}

/** La ayuda de un campo, o nada. */
export function FieldHint({ id, hint }: FieldHintProps) {
  if (hint === undefined) {
    return null
  }
  return (
    <p id={id} className="m-0 text-sm text-muted-foreground">
      {hint}
    </p>
  )
}
