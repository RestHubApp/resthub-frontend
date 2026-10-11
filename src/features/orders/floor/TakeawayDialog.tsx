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
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
        setOpen(true)
      }}>
        <Icon name="takeaway" size={18} />
        <span>Para llevar / Delivery</span>
      </Button>
      {open ? (
        <Suspense fallback={null}>
          <TakeawayForm onClose={() => {
            setOpen(false)
          }} />
        </Suspense>
      ) : null}
    </>
  )
}
