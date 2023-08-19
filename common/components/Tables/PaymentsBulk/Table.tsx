import { CloseCircleOutlined } from '@ant-design/icons'
import { Alert, Form, Input, InputRef, Popconfirm, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import useService from '@common/modules/hooks/useService'
import { AppRoutes } from '@utils/constants'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const { form } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const {
    data: companies,
    isLoading: isCompaniesLoading,
    isError,
  } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !domainId || !streetId }
  )

  const { service, isLoading: isServiceLoading } = useService({
    domainId,
    streetId,
    serviceId,
  })

  const isLoading = isCompaniesLoading || isServiceLoading

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

  const columns = getDefaultColumns(service, handleDelete).map((column) => {
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
  })

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        !isOnPage && {
          responsive: false,
          size: 'small',
          pageSize: 8,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }
      }
      loading={isLoading}
      columns={columns}
      components={components}
      dataSource={dataSource}
      scroll={{ x: 1500 }}
    />
  )
}

export default InvoicesTable

const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
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
        dataIndex: 'servicePricePerMeter',
        render: (_, company) =>
          company.servicePricePerMeter || service?.rentPrice,
        editable: true,
      },
      {
        title: 'Загальне',
        render: (_, company) => {
          const prioPrice = company.servicePricePerMeter || service?.rentPrice
          return prioPrice * company.totalArea
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
        render: (_, company) => company.pricePerMeter * company.totalArea,
      },
    ],
  },
  {
    title: 'Електрика',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_elec',
        editable: true,
      },
      {
        title: 'Нова',
        dataIndex: 'new_elec',
        editable: true,
      },
    ],
  },
  {
    title: 'Вода',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_water',
        editable: true,
      },
      {
        title: 'Нова',
        dataIndex: 'new_water',
        editable: true,
      },
    ],
  },
  {
    title: 'Індекс інфляції',
    dataIndex: 'tmp_1',
    editable: true,
  },
  {
    title: 'ТПВ',
    dataIndex: 'tmp_2',
    editable: true,
  },
  {
    title: 'Знижка',
    dataIndex: 'tmp_3',
    editable: true,
  },
  {
    fixed: 'right',
    align: 'center',
    title: '',
    dataIndex: '',
    width: 50,
    render: (_, record: { key: React.Key }) => (
      <Popconfirm
        title="Видалити запис?"
        onConfirm={() => handleDelete && handleDelete(record.key)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
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
