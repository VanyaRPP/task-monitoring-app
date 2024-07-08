import { FormInstance } from 'antd'

export interface TableProps {
  form?: FormInstance

  editable?: boolean
  disabled?: boolean

  extended?: boolean
  expandable?: boolean
  filterable?: boolean
  selectable?: boolean

  loading?: boolean

  selected?: string[]
  onSelect?: (items: string[]) => void
  onDelete?: (item: string) => void

  className?: string
  style?: React.CSSProperties
}
