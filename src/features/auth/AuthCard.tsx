import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

interface AuthCardProps {
  readonly title: string
  readonly description?: ReactNode
  readonly children: ReactNode
}

/**
 * El marco de las pantallas de acceso que no son el formulario de entrada.
 *
 * El titulo es el `h1` de la pagina: cada una de estas pantallas es una ruta
 * propia y el lector de pantalla necesita saber donde cayo.
 */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="mx-auto my-auto w-full max-w-md">
      <Card className="w-full gap-6 py-6">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <h1 className="m-0 font-heading text-2xl leading-tight font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          {description === undefined ? null : (
            <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-6 sm:px-8">{children}</CardContent>
      </Card>
    </div>
  )
}
