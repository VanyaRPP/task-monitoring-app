import React, { FC, Key, ReactNode, useState } from 'react'
import { Button, Form, Input, InputNumber, Table } from 'antd'
import { CheckOutlined, CloseOutlined, EditFilled } from '@ant-design/icons'
import moment from 'moment'
import s from './style.module.scss'

interface Item {
  key: string
  num: number
  name: string | ReactNode
  count: number
  price: number
  sum: number
}

const originData: Item[] = [
  {
    key: '1',
    num: 1,
    name: (
      <span className={s.rowText}>
        За утримання{' '}
        <span className={s.month}>({moment().format('MMMM')})</span>
      </span>
    ),
    count: 110,
    price: 500,
    get sum() {
      return this.count * this.price
    },
  },
  {
    key: '2',
    num: 2,
    name: (
      <span className={s.rowText}>
        Розміщення <span className={s.month}>({moment().format('MMMM')})</span>
      </span>
    ),
    count: 90,
    price: 400,
    get sum() {
      return this.count * this.price
    },
  },
  {
    key: '3',
    num: 3,
    name: (
      <span className={s.rowText}>
        Електропостачання{' '}
        <span className={s.month}>({moment().format('MMMM')})</span>
      </span>
    ),
    count: 190,
    price: 100,
    get sum() {
      return this.count * this.price
    },
  },
]

interface EditableCellProps {
  editing: boolean
  dataIndex: string
  title: any
  inputType: 'number' | 'text'
  record: Item
  index: number
  children: ReactNode
}

const EditableCell: FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
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
              message: `Please Input ${title}!`,
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

const PaymentModalTable: FC = () => {
  const [form] = Form.useForm()
  const [data, setData] = useState(originData)
  const [editingKey, setEditingKey] = useState('')

  const isEditing = (record: Item) => record.key === editingKey

  const edit = (record: Partial<Item> & { key: Key }) => {
    form.setFieldsValue({
      count: '',
      price: '',
      ...record,
    })
    setEditingKey(record.key)
  }

  const cancel = () => {
    setEditingKey('')
  }

  const save = async (key: Key) => {
    try {
      const row = (await form.validateFields()) as Item

      const newData = [...data]
      const index = newData.findIndex((item) => key === item.key)
      if (index > -1) {
        const item = newData[index]

        newData.splice(index, 1, {
          ...item,
          ...row,
        })
        setData(newData)
        setEditingKey('')
      } else {
        newData.push(row)
        setData(newData)
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  const columns = [
    {
      title: '№',
      dataIndex: 'num',
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      width: '25%',
    },
    {
      title: 'К-сть',
      dataIndex: 'count',
      width: 'max-content',
      editable: true,
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      width: 'max-content',
      editable: true,
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      width: 'max-content',
    },
    {
      title: '',
      dataIndex: '',
      render: (_: any, record: Item) => {
        const editable = isEditing(record)
        return editable ? (
          <>
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => save(record.key)}
            />
            <Button type="link" icon={<CloseOutlined />} onClick={cancel} />
          </>
        ) : (
          <Button
            type="link"
            icon={<EditFilled />}
            onClick={() => edit(record)}
          />
        )
      },
    },
  ]

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record: Item) => ({
        record,
        inputType: 'number',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={false}
      />
    </Form>
  )
}

export default PaymentModalTable
