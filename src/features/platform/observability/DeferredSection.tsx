import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Button } from '../../../components/ui/button'

interface Props {
  readonly name: string
  readonly anchor?: string
  readonly children: ReactNode
}

/** Las tablas que no están a la vista no consumen JS ni piden datos aún. */
export default function DeferredSection({ name, anchor, children }: Props) {
  const [visible, setVisible] = useState(false)
  const target = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (visible || !target.current || typeof IntersectionObserver !== 'function') return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true)
    }, { rootMargin: '250px 0px' })
    observer.observe(target.current)
    return () => { observer.disconnect() }
  }, [visible])

  return (
    <div ref={target} id={visible ? undefined : anchor} tabIndex={-1} className="scroll-mt-4">
      {visible ? children : (
        <div className="rounded-xl border bg-card p-6">
          <p className="m-0 font-semibold">{name}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => { setVisible(true) }}>
            Cargar {name.toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  )
}
