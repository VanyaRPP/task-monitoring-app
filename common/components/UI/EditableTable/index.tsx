import { FormInstance, Table } from 'antd'
import { TableProps } from 'antd/es/table'

import { EditableCell } from '@common/components/UI/EditableCell'
import { EditableRow } from '@common/components/UI/EditableRow'
import {
  EditableColumnType,
  transformColumnsToEditable,
} from '@common/components/UI/EditableColumn'

export interface Props extends TableProps<any> {
  form: FormInstance
  columns?: EditableColumnType[]
  onSave?: (...args: any) => void
}

const EditableTable: React.FC<Props> = ({
  form,
  columns,
  onSave,
  ...restProps
}) => {
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  const editableColumns = transformColumnsToEditable(columns, onSave)

  return (
    <Table components={components} columns={editableColumns} {...restProps} />
  )
}

export default EditableTable
