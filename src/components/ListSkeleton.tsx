import { cn } from 'cn'

import LoadingRegion from './LoadingRegion'
import { Skeleton } from './ui/skeleton'

interface ListSkeletonProps {
  readonly label: string
  /** Cuántos elementos dibujar. */
  readonly count?: number
  /** La disposición de la lista, la misma que usa el contenido real. */
  readonly className?: string
  /** El alto y la forma de cada elemento. */
  readonly itemClassName?: string
}

/** La silueta de una lista o una grilla mientras cargan sus datos. */
export default function ListSkeleton({
  label,
  count = 4,
  className = 'flex flex-col gap-2',
  itemClassName = 'h-16 rounded-xl',
}: ListSkeletonProps) {
  return (
    <LoadingRegion label={label} className={className}>
      {Array.from({ length: count }, (_, indice) => (
        <Skeleton key={indice} className={cn('w-full', itemClassName)} />
      ))}
    </LoadingRegion>
  )
}
