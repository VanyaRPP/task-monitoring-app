export interface TableProps {
  selected?: string[]
  onSelect?: (items: string[]) => void
  onDelete?: (item: string) => void
  editable?: boolean
  className?: string
  style?: React.CSSProperties
}
