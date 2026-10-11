import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import { buttonVariants } from '@/components/ui/button'

interface BackToLinkProps {
  readonly to: string
  readonly label: string
}

/** El enlace «Volver» de la cabecera de la receta. */
export function BackToLink({ to, label }: BackToLinkProps) {
  return (
    <Link to={to} className={buttonVariants({ variant: 'outline', className: 'h-11 px-4' })}>
      <Icon name="previous" size={16} />
      <span>{label}</span>
    </Link>
  )
}
