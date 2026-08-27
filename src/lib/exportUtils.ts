/**
 * Export utilities for downloading structured data as CSV or JSON in the browser.
 */

export interface ExportColumn<T> {
  key: keyof T | string
  label: string
  format?: (value: any, item: T) => string | number
}

/**
 * Exports an array of objects to a CSV file and triggers a browser download.
 * Adds UTF-8 BOM so Microsoft Excel automatically opens accented characters correctly.
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns?: ExportColumn<T>[]
): void {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar con los filtros actuales.")
    return
  }

  // Determine headers & keys
  const headers = columns
    ? columns.map((col) => col.label)
    : Object.keys(data[0])

  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","))

  // Data rows
  data.forEach((item) => {
    const rowValues = columns
      ? columns.map((col) => {
          const rawVal = item[col.key as string]
          const formatted = col.format ? col.format(rawVal, item) : rawVal
          if (formatted === null || formatted === undefined) return '""'
          if (typeof formatted === "object") {
            return `"${JSON.stringify(formatted).replace(/"/g, '""')}"`
          }
          return `"${String(formatted).replace(/"/g, '""')}"`
        })
      : Object.values(item).map((val) => {
          if (val === null || val === undefined) return '""'
          if (typeof val === "object") {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`
          }
          return `"${String(val).replace(/"/g, '""')}"`
        })

    csvRows.push(rowValues.join(","))
  })

  // UTF-8 BOM (\uFEFF) ensures Excel reads UTF-8 correctly
  const csvContent = "\uFEFF" + csvRows.join("\r\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename.replace(/\.csv$/, "")}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports data to a formatted JSON file.
 */
export function exportToJSON<T>(filename: string, data: T): void {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename.replace(/\.json$/, "")}_${new Date().toISOString().slice(0, 10)}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
