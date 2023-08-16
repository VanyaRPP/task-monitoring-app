import { CloseCircleOutlined } from '@ant-design/icons'
import { Button, Form, Input, InputRef, Popconfirm, Table } from 'antd'
import { useEffect, useRef, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import useService from '@common/modules/hooks/useService'

const InvoicesTable: React.FC = () => {
  const { form } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { data: companies } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !domainId || !streetId }
  )

  const { service } = useService({
    domainId,
    streetId,
    serviceId,
  })

  const [dataSource, setDataSource] = useState([])

  useEffect(() => {
    setDataSource(
      companies?.map((company, index) => ({
        key: index.toString(),
        ...company,
      }))
    )
  }, [companies])

  const handleDelete = (key: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item.key !== key))
    // TODO: update on remote
  }

  const handleSave = (row) => {
    const newData = [...dataSource]
    const index = newData.findIndex((item) => row.key === item.key)
    const item = newData[index]
    newData.splice(index, 1, {
      ...item,
      ...row,
    })
    setDataSource(newData)
    // TODO: update on remote
  }

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  const columns = getDefaultColumns(service, dataSource, handleDelete).map(
    (column) => {
      const newColumn = column

      newColumn.children = newColumn.children?.map((children) => ({
        ...children,
        onCell: (record: DataType) => ({
          record,
          editable: children.editable,
          dataIndex: children.dataIndex,
          title: children.title,
          handleSave,
        }),
      }))

      return {
        ...newColumn,
        onCell: (record: DataType) => ({
          record,
          editable: newColumn.editable,
          dataIndex: newColumn.dataIndex,
          title: newColumn.title,
          handleSave,
        }),
      }
    }
  )

  return (
    <Table
      components={components}
      dataSource={dataSource}
      columns={columns}
      bordered
    />
  )
}

export default InvoicesTable

const getDefaultColumns = (
  service?: any,
  dataSource?: any[],
  handleDelete?: (row: any) => void
) => [
  {
    title: 'Компанія',
    dataIndex: 'companyName',
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        render: (_, obj) => obj.servicePricePerMeter || service?.rentPrice,
        editable: true,
      },
      {
        title: 'Загальне',
        render: (_, obj) => {
          const prioPrice = obj.servicePricePerMeter || service?.rentPrice
          return prioPrice * obj.totalArea
        },
      },
    ],
  },
  {
    title: 'Розміщення',
    children: [
      {
        title: 'За м²',
        dataIndex: 'pricePerMeter',
        editable: true,
      },
      {
        title: 'Загальне',
        render: (_, obj) => obj.pricePerMeter * obj.totalArea,
      },
    ],
  },
  {
    title: 'Електрика',
    children: [
      {
        title: 'Стара',
      },
      {
        title: 'Нова',
      },
    ],
  },
  {
    title: 'Вода',
    children: [
      {
        title: 'Стара',
      },
      {
        title: 'Нова',
      },
    ],
  },
  {
    title: 'Індекс інфляції',
    editable: true,
  },
  {
    title: 'ТПВ',
    editable: true,
  },
  {
    title: 'Знижка',
    editable: true,
  },
  {
    title: '',
    render: (_, record: { key: React.Key }) =>
      dataSource?.length >= 1 ? (
        <Popconfirm
          title="Видалити запис?"
          onConfirm={() => handleDelete && handleDelete(record.key)}
        >
          <CloseCircleOutlined />
        </Popconfirm>
      ) : null,
  },
]

export interface DataType {
  key: React.Key
  [key: string]: any
}

export interface EditableCellProps {
  title: React.ReactNode
  editable: boolean
  children: React.ReactNode
  dataIndex: string
  record: any
  handleSave: (record: any) => void
}

export const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const { form } = useInvoicesPaymentContext()

  const [editing, setEditing] = useState(false)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (editing) inputRef.current!.focus()
  }, [editing])

  const toggleEdit = () => {
    setEditing(!editing)
    form.setFieldsValue({ [dataIndex]: record[dataIndex] })
  }

  const save = async () => {
    try {
      const values = await form.validateFields()

      toggleEdit()
      handleSave({ ...record, ...values })
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  return (
    <td {...restProps}>
      {editable ? (
        editing ? (
          <Form.Item name={dataIndex}>
            <Input ref={inputRef} onPressEnter={save} onBlur={save} />
          </Form.Item>
        ) : (
          <div style={{ paddingRight: 24 }} onClick={toggleEdit}>
            {children}
          </div>
        )
      ) : (
        children
      )}
    </td>
  )
}

export interface EditableRowProps {
  index: number
}

export const EditableRow: React.FC<EditableRowProps> = ({
  index,
  ...props
}) => {
  return <tr {...props} />
}
