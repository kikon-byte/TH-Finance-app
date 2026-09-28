export function downloadCSV(
  filename: string,
  headers: string[],
  rowsOrNestedRows: (string | number | boolean | null | undefined)[][] | (string | number | boolean | null | undefined)[][][]
) {
  // If the 3rd argument is nested like [ [row1, row2, ...] ], flatten it
  let rows: (string | number | boolean | null | undefined)[][]
  if (rowsOrNestedRows.length > 0 && Array.isArray(rowsOrNestedRows[0]) && Array.isArray(rowsOrNestedRows[0][0])) {
    rows = (rowsOrNestedRows as (string | number | boolean | null | undefined)[][][])[0]
  } else {
    rows = rowsOrNestedRows as (string | number | boolean | null | undefined)[][]
  }

  const escapeCSV = (val: string | number | boolean | null | undefined) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const headerLine = headers.map(escapeCSV).join(',')
  const rowLines = rows.map(r => (Array.isArray(r) ? r.map(escapeCSV).join(',') : String(r)))
  const csvContent = [headerLine, ...rowLines].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
