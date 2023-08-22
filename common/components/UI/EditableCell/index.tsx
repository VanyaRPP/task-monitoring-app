import { Form, Input } from 'antd'

export interface EditableCellProps {
  editable?: boolean
  children?: React.ReactNode
  dataIndex: string
  record: any
  onSave?: (
    oldValue: { [key: string]: any },
    newValue: { [key: string]: any },
    record: any
  ) => void
  type: 'number' | 'string'
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editable,
  children,
  dataIndex,
  record,
  onSave,
  type,
  ...restProps
}) => {
  const handleSave = (event) => {
    const oldValue = { [dataIndex]: record?.[dataIndex] }
    const newValue = { [dataIndex]: event.target.value }

    onSave && onSave(oldValue, newValue, record)
  }

  return (
    <td {...restProps}>
      {dataIndex ? (
        <Form.Item
          initialValue={record?.[dataIndex]}
          name={[record?.companyName, dataIndex]}
          style={{ margin: 0 }}
        >
          {editable ? (
            <Input type={type} onPressEnter={handleSave} onBlur={handleSave} />
          ) : (
            children
          )}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  )
}
