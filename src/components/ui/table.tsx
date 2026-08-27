import React from "react"
import { cn } from "@/lib/utils"

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-zinc-800 bg-[#18181b] shadow-sm">
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
      className={cn("bg-[#18181b] border-b border-zinc-800 text-xs uppercase tracking-wider font-semibold text-zinc-400", className)}
      {...props}
    />
  )
)
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("divide-y divide-zinc-800/80 bg-[#18181b]", className)}
      {...props}
    />
  )
)
TableBody.displayName = "TableBody"

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("bg-zinc-900/90 font-medium text-zinc-200 border-t border-zinc-800", className)}
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
        "transition-colors duration-150 text-zinc-200 hover:bg-zinc-800/60 border-b border-zinc-800/80 data-[state=selected]:bg-orange-500/10",
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
        "h-11 px-4 text-left align-middle font-semibold text-zinc-400 text-xs uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle text-zinc-200 [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-xs text-zinc-500 italic text-center p-2", className)}
      {...props}
    />
  )
)
TableCaption.displayName = "TableCaption"

export function TableEmpty({ colSpan, message = "No se encontraron registros." }: { colSpan: number; message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-zinc-400">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}
