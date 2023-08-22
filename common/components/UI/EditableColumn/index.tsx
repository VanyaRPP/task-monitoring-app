import { ColumnType } from 'antd/lib/table'

export type EditableColumnType = ColumnType<any> & {
  editable?: boolean
  type?: 'number' | 'string'
}
export interface EditableColumn {
  [key: string]: any
  onCell: (record: any) => {
    record: any
    editable: boolean
    dataIndex: any
    title: any
    type?: 'number' | 'string'
  }
}

export const getEditableColumn = (
  column: EditableColumnType,
  onSave?: (...args) => void
): EditableColumn => ({
  ...column,
  onCell: (record) => ({
    record,
    editable: !!column.editable,
    dataIndex: column.dataIndex,
    title: column.title,
    type: column.type ?? 'string',
    onSave,
  }),
})

export const transformColumnsToEditable = (
  columns: EditableColumnType[],
  onSave?: (...args) => void
): EditableColumnType[] => {
  const newColumns = [...columns]

  return newColumns.map((column: EditableColumnType) =>
    'children' in column
      ? {
          ...Object(column),
          children: transformColumnsToEditable(
            (column as any).children as EditableColumnType[],
            onSave
          ),
        }
      : getEditableColumn(column, onSave)
  )
}
