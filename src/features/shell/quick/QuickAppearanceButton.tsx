import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShellIcon } from '@/features/shell/ShellIcon'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { QuickAppearancePanel } from './QuickAppearancePanel'

const LABEL = 'Apariencia rápida'

interface QuickAppearanceButtonProps {
  /** `icon`: el botón de la cabecera del celular; `tile`: el botón cuadrado del pie de la barra lateral. */
  readonly variant: 'icon' | 'tile'
}

/**
 * El acceso a «Apariencia rápida»: una hoja que sube desde abajo en el celular y
 * sale por la derecha en la laptop. Lleva a la pantalla completa para lo demás.
 */
export function QuickAppearanceButton({ variant }: QuickAppearanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isWide = useMediaQuery('(min-width: 1024px)')

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {variant === 'icon' ? (
          <Button type="button" variant="ghost" size="icon" aria-label={LABEL}>
            <ShellIcon name="appearance" size={22} />
          </Button>
        ) : (
          // 44 px fijos, aun con la densidad compacta: es un blanco solo de ícono.
          <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={LABEL} title={LABEL}>
            <ShellIcon name="appearance" size={20} />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side={isWide ? 'right' : 'bottom'}
        className="gap-4 px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] max-lg:rounded-t-2xl lg:max-w-xs"
      >
        <SheetTitle className="m-0 font-heading text-lg font-semibold">{LABEL}</SheetTitle>
        <SheetDescription className="sr-only">Modo, tamaño del texto y alto contraste. Los cambios se ven al instante.</SheetDescription>
        <QuickAppearancePanel
          onNavigate={() => {
            setIsOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
