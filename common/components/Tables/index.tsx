// TODO: handle @deprecated
export interface TableProps {
  /**
   * @deprecated replace with more flexible solutions [`editable`, `pagination`, `select`, `delete`, `filterable`, `expandable`]
   */
  selected?: string[]
  /**
   * @deprecated replace with more flexible solutions [`editable`, `pagination`, `select`, `delete`, `filterable`, `expandable`]
   */
  onSelect?: (items: string[]) => void
  /**
   * @deprecated replace with more flexible solutions [`editable`, `pagination`, `select`, `delete`, `filterable`, `expandable`]
   */
  onDelete?: (item: string) => void

  editable?: boolean
  select?: {
    selected?: string[]
    onSelect?: (items: string[]) => void
    disabled?: boolean
  }
  delete?: {
    onDelete?: (item: string) => void
    disable?: boolean
  }
  expandable?: boolean
  filterable?: boolean

  className?: string
  style?: React.CSSProperties
}
