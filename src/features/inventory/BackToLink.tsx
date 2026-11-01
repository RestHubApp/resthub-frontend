import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'

interface BackToLinkProps {
  readonly to: string
  readonly label: string
}

/** El enlace «Volver» de la cabecera de la receta. */
export function BackToLink({ to, label }: BackToLinkProps) {
  return (
    <Link to={to} className={buttonVariants({ variant: 'outline' })}>
      <Icon glyph={icons.previous} size={16} />
      <span>{label}</span>
    </Link>
  )
}
