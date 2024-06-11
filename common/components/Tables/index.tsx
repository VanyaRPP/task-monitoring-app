export interface TableProps {
  editable?: boolean
  extended?: boolean
  expandable?: boolean
  filterable?: boolean
  selectable?: boolean

  selected?: string[]
  onSelect?: (items: string[]) => void
  onDelete?: (item: string) => void

  className?: string
  style?: React.CSSProperties
}
