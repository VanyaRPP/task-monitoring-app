import { Form, Input, InputNumber } from 'antd'
import { FC, ReactNode } from 'react'
import { Item } from '..'

interface EditableCellProps {
  editing: boolean
  dataIndex: string
  inputType: 'number' | 'text'
  record: Item
  index: number
  children: ReactNode
}

const EditableCell: FC<EditableCellProps> = ({
  editing,
  dataIndex,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  )
}

export default EditableCell
