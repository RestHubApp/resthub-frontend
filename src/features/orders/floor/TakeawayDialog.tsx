import { Suspense, useState } from 'react'
import { lazyNamed } from '@/components/lazyNamed'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

// El formulario trae react-hook-form y zod: se baja al tocar el botón.
const TakeawayForm = lazyNamed(() => import('./TakeawayForm'), 'TakeawayForm')

/**
 * "Para llevar": el botón de la pantalla de pedidos. El formulario con los
 * datos del cliente es `TakeawayForm` y se carga al abrirlo.
 */
export function TakeawayDialog() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button type="button" onClick={() => {
        setIsOpen(true)
      }}>
        <Icon name="takeaway" size={18} />
        <span>Para llevar / Delivery</span>
      </Button>
      {isOpen ? (
        <Suspense fallback={null}>
          <TakeawayForm onClose={() => {
            setIsOpen(false)
          }} />
        </Suspense>
      ) : null}
    </>
  )
}
