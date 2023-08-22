import { Form, Input } from 'antd'

export interface EditableCellProps {
  editable?: boolean
  children?: React.ReactNode
  dataIndex: string
  record: any
  onSave?: (...args) => void
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editable,
  children,
  dataIndex,
  record,
  onSave,
  ...restProps
}) => {
  return (
    <td {...restProps}>
      {dataIndex ? (
        <Form.Item
          initialValue={record?.[dataIndex]}
          name={[record?.companyName, dataIndex]}
          style={{ margin: 0 }}
        >
          {editable ? (
            <Input onPressEnter={onSave} onBlur={onSave} />
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
