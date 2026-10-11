import { type RefObject, useEffect, useRef } from 'react'

import type { CurrentUserResponse } from '@/api/types'
import { tokenExpiresAt } from '@/services/tokenExpiry'
import { useSession } from '@/store/session'
import { previewTimeLeft } from './previewCountdown'
import { PreviewExitButton } from './PreviewExitButton'
import { ShellIcon } from './ShellIcon'
import { useSecondTick } from './useSecondTick'

// El alto de la franja, para que la barra lateral y la cabecera del celular,
// que también se quedan fijas arriba, se acomoden debajo y no detrás.
const HEIGHT = '--preview-banner-h'

function usePublishedHeight(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const slot = ref.current
    const root = document.documentElement
    if (slot === null) {
      return
    }
    const observer = new ResizeObserver(() => {
      root.style.setProperty(HEIGHT, `${String(slot.offsetHeight)}px`)
    })
    observer.observe(slot)
    return () => {
      observer.disconnect()
      root.style.removeProperty(HEIGHT)
    }
  }, [])
  return ref
}

interface PreviewBannerProps {
  readonly account: CurrentUserResponse
}

/**
 * La franja de la vista previa, fija arriba en todas las pantallas.
 *
 * Dice en qué local y como quién se está mirando, cuánto falta para que
 * venza (no se renueva) y ofrece salir. Tiene otro color que el armazón para
 * que nadie la confunda con un restaurante real.
 */
export function PreviewBanner({ account }: PreviewBannerProps) {
  const token = useSession((state) => state.token)
  const now = useSecondTick()
  const ref = usePublishedHeight()
  const remaining = previewTimeLeft(token === null ? null : tokenExpiresAt(token), now)

  return (
    <section
      ref={ref}
      aria-label="Vista previa"
      className="sticky top-0 z-40 bg-warning text-white pt-[env(safe-area-inset-top)]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6">
        <p className="m-0 flex min-w-0 flex-[1_1_16rem] items-center gap-2 text-sm font-semibold">
          <ShellIcon name="view" size={18} />
          <span className="min-w-0 break-words">
            Vista previa · {account.restaurant.name} · como {account.user.role_label}
          </span>
        </p>
        {remaining === null ? null : (
          <span
            role="timer"
            className={`rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${remaining.soon ? 'bg-white text-warning' : ''}`}
          >
            {remaining.label}
          </span>
        )}
        <PreviewExitButton />
      </div>
    </section>
  )
}
