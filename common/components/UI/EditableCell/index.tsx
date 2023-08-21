import { Form, FormInstance, Input } from 'antd'

export interface EditableCellProps {
  form: FormInstance
  editable?: boolean
  children?: React.ReactNode
  dataIndex: string
  record: any
  onChange?: (...args: any) => void
}

export const EditableCell: React.FC<EditableCellProps> = ({
  form,
  editable,
  children,
  dataIndex,
  record,
  onChange,
  ...restProps
}) => {
  const save = async () => {
    try {
      const values = await form.validateFields()
      const value = values[record.companyName]

      onChange && onChange({ record, value })
    } catch (error) {
      console.error('Save failed', error)
    }
  }

  return (
    <td {...restProps}>
      <Form.Item
        initialValue={record?.[dataIndex]}
        name={[record?.companyName, dataIndex]}
        style={{ margin: 0 }}
      >
        {editable ? <Input onBlur={save} onPressEnter={save} /> : children}
      </Form.Item>
    </td>
  )
}
