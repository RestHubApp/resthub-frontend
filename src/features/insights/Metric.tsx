import type { ReactNode } from 'react'

interface MetricProps {
  readonly label: string
  readonly children: ReactNode
}

/** Un dato con su nombre, dentro de una lista de definiciones. */
export default function Metric({ label, children }: MetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="m-0 text-sm font-medium">{children}</dd>
    </div>
  )
}
