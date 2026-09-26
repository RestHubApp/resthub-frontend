import type { ComponentProps } from 'react'
import { NavLink } from 'react-router'

import { useScreenPreload } from './screenPreload'

type PreloadLinkProps = ComponentProps<typeof NavLink> & { readonly to: string }

/** Un enlace del menú que adelanta el archivo y los datos de su pantalla. */
export default function PreloadLink(props: PreloadLinkProps) {
  const handlers = useScreenPreload(props.to)
  return <NavLink {...handlers} {...props} />
}
