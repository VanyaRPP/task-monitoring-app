import { ColumnType } from 'antd/lib/table'

export type EditableColumnType = ColumnType<any> & { editable?: boolean }
export interface EditableColumn {
  [key: string]: any
  onCell: (record: any) => {
    record: any
    editable: boolean
    dataIndex: any
    title: any
  }
}

export const getEditableColumn = (
  column: EditableColumnType
): EditableColumn => ({
  ...column,
  onCell: (record) => ({
    record,
    editable: !!column.editable,
    dataIndex: column.dataIndex,
    title: column.title,
  }),
})

export const transformColumnsToEditable = (
  columns: EditableColumnType[]
): EditableColumnType[] =>
  [...columns].map((column: EditableColumnType) =>
    'children' in column
      ? {
          ...Object(column),
          children: transformColumnsToEditable(
            (column as any).children as EditableColumnType[]
          ),
        }
      : getEditableColumn(column)
  )
