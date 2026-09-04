import React from "react"
import { cn } from "@/lib/utils"

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm text-left border-collapse", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-card border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
)
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("divide-y divide-border/80 bg-card", className)}
      {...props}
    />
  )
)
TableBody.displayName = "TableBody"

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("bg-muted/50 font-medium text-foreground border-t border-border", className)}
      {...props}
    />
  )
)
TableFooter.displayName = "TableFooter"

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors duration-150 text-foreground hover:bg-muted/50 border-b border-border/80 data-[state=selected]:bg-primary/10",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-3 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  compact?: boolean
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, compact = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        compact ? "py-1.5 px-3 text-xs" : "p-3.5",
        "align-middle text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-xs text-muted-foreground italic text-center p-2", className)}
      {...props}
    />
  )
)
TableCaption.displayName = "TableCaption"

export function TableEmpty({ colSpan, message = "No se encontraron registros." }: { colSpan: number; message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}
