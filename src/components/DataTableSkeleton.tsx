import LoadingRegion from './LoadingRegion'
import { Skeleton } from './ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

interface DataTableSkeletonProps {
  /** Las cabeceras reales: se leen desde el primer momento y fijan el ancho de las columnas. */
  readonly headers: readonly string[]
  readonly rows: number
}

/** La tabla con sus cabeceras y filas vacías mientras llegan los datos. */
export default function DataTableSkeleton({ headers, rows }: DataTableSkeletonProps) {
  return (
    <LoadingRegion label="Cargando…" className="rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="px-3">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, fila) => (
            <TableRow key={fila} className="hover:bg-transparent">
              {headers.map((header) => (
                <TableCell key={header} className="px-3 py-3">
                  <Skeleton className="h-4 w-full max-w-32" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LoadingRegion>
  )
}
