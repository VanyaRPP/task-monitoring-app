// TODO: extend from omitted antd#TableProps in future
export interface TableProps {
  editable?: boolean
  extended?: boolean
  expandable?: boolean
  filterable?: boolean
  selectable?: boolean

  onSelect?: (keys: any[]) => void
  onDelete?: (key: any) => void

  className?: string
  style?: React.CSSProperties
}
