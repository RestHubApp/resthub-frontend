import Icon from '../../../components/Icon'

/** El aviso de que los percentiles salen de una muestra y no de todas las peticiones. */
export default function SampledNotice({ children }: { readonly children: string }) {
  return (
    <p className="m-0 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
      <Icon name="alerta" size={16} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold">Muestreado.</strong> {children}
      </span>
    </p>
  )
}
