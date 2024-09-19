import { useState } from 'react'

// Custom hook to manage column visibility
export const useColumnVisibility = (initialVisibleColumns: string[]) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    initialVisibleColumns
  )

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns((prevVisibleColumns) => {
      if (prevVisibleColumns.includes(columnKey)) {
        return prevVisibleColumns.filter((key) => key !== columnKey)
      } else {
        return [...prevVisibleColumns, columnKey]
      }
    })
  }

  return {
    visibleColumns,
    toggleColumnVisibility,
  }
}
